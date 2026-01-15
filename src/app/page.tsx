'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Play, RefreshCw, BarChart3, Copy, Download, Upload, Save, Database, Trophy, RefreshCcw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type Outcome = '1' | 'X' | '2'

interface Game {
  id: string
  gameNumber: number
  homeTeam: string
  awayTeam: string
  weightHome: number
  weightDraw: number
  weightAway: number
}

interface BetRow {
  rowNumber: number
  picks: Outcome[]
}

interface VeikkausData {
  scraped_at: string
  url: string
  game_name: string
  sport: string
  closing_time: string | null
  pool_size: string | null
  matches: Array<{
    match_number: string
    home_team: string
    away_team: string
    percentage_1: number
    percentage_x: number
    percentage_2: number
    total: number
  }>
}

interface ScoreData {
  hitCount: number
  totalPossible: number
  correctCount: number
}

export default function Vakioveikkaus() {
  const [games, setGames] = useState<Game[]>(() =>
    Array.from({ length: 13 }, (_, i) => ({
      id: `game-${i}`,
      gameNumber: i + 1,
      homeTeam: `Joukkue ${i * 2 + 1}`,
      awayTeam: `Joukkue ${i * 2 + 2}`,
      weightHome: 50,
      weightDraw: 20,
      weightAway: 30,
    }))
  )

  const [generatedRows, setGeneratedRows] = useState<BetRow[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [veikkausData, setVeikkausData] = useState<VeikkausData | null>(null)
  const [totalCost] = useState(32) // 128 rows * 0.25 euros
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingScores, setIsSavingScores] = useState(false)
  const [isLoadingScores, setIsLoadingScores] = useState(false)
  const [scores, setScores] = useState<ScoreData>({
    hitCount: 0,
    totalPossible: 13,
    correctCount: 0,
  })
  const [latestScore, setLatestScore] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateWeight = (gameIndex: number, type: 'home' | 'draw' | 'away', value: number) => {
    const newGames = [...games]
    const game = newGames[gameIndex]

    if (type === 'home') game.weightHome = value
    else if (type === 'draw') game.weightDraw = value
    else if (type === 'away') game.weightAway = value

    // Normalize weights
    const total = game.weightHome + game.weightDraw + game.weightAway
    if (total > 0) {
      game.weightHome = Math.round((game.weightHome / total) * 100)
      game.weightDraw = Math.round((game.weightDraw / total) * 100)
      game.weightAway = 100 - game.weightHome - game.weightDraw
    }

    setGames(newGames)
  }

  const generateRows = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/vakioveikkaus/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games }),
      })

      if (!response.ok) throw new Error('Failed to generate rows')

      const data = await response.json()
      setGeneratedRows(data.rows)
      toast({
        title: 'Rivit luotu onnistuneesti',
        description: `Luotiin ${data.rows.length} riviä`,
      })
    } catch (error) {
      toast({
        title: 'Virhe',
        description: 'Rivien luominen epäonnistui',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data: VeikkausData = JSON.parse(content)

        // Check if we have exactly 13 matches
        if (data.matches.length !== 13) {
          toast({
            title: 'Varoitus',
            description: `Tiedostossa löytyi ${data.matches.length} ottelua, odotettiin 13`,
            variant: 'destructive',
          })
        }

        // Convert JSON data to games format
        const newGames: Game[] = data.matches.map((match) => ({
          id: `veikkaus-${match.match_number}`,
          gameNumber: parseInt(match.match_number),
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          // Use Veikkaus percentages as weights
          weightHome: match.percentage_1,
          weightDraw: match.percentage_x,
          weightAway: match.percentage_2,
        }))

        // Fill missing games if needed
        if (newGames.length < 13) {
          for (let i = newGames.length; i < 13; i++) {
            newGames.push({
              id: `game-${i}`,
              gameNumber: i + 1,
              homeTeam: `Joukkue ${i * 2 + 1}`,
              awayTeam: `Joukkue ${i * 2 + 2}`,
              weightHome: 33,
              weightDraw: 34,
              weightAway: 33,
            })
          }
        }

        setGames(newGames)
        setVeikkausData(data)
        setGeneratedRows([]) // Clear previous rows

        toast({
          title: 'Tiedot tuotu onnistuneesti',
          description: `Tuotu ${data.game_name} - ${data.matches.length} ottelua`,
        })
      } catch (error) {
        console.error('Import error:', error)
        toast({
          title: 'Virhe tiedoston luvussa',
          description: 'JSON-tiedoston jäsennys epäonnistui. Tarkista tiedoston muoto.',
          variant: 'destructive',
        })
      } finally {
        setIsImporting(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      toast({
        title: 'Virhe tiedoston luvussa',
        description: 'Tiedoston lukeminen epäonnistui',
        variant: 'destructive',
      })
      setIsImporting(false)
    }

    reader.readAsText(file)
  }

  const saveScoresToMongoDB = async () => {
    setIsSavingScores(true)

    try {
      const response = await fetch('/api/mongodb/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName: veikkausData?.game_name,
          poolSize: veikkausData?.pool_size,
          date: new Date().toISOString(),
          scores: generatedRows.map(row => row.picks.join(',')),
          hitCount: scores.hitCount,
          totalPossible: scores.totalPossible,
          correctCount: scores.correctCount,
        }),
      })

      if (!response.ok) throw new Error('Failed to save scores to MongoDB')

      const data = await response.json()

      toast({
        title: 'Tulokset tallennettu',
        description: `Tallennettu ${data.data?.hitCount}/${scores.totalPossible} osumaa (${data.data.percentage}%) -tietokantaan`,
      })
    } catch (error) {
      console.error('Save scores error:', error)
      toast({
        title: 'Virhe tallennettaessa',
        description: error instanceof Error ? error.message : 'Tulokset tallentaminen epäonnistui',
        variant: 'destructive',
      })
    } finally {
      setIsSavingScores(false)
    }
  }

  const loadScoresFromMongoDB = async () => {
    setIsLoadingScores(true)

    try {
      const response = await fetch('/api/mongodb/scores/latest')

      if (!response.ok) throw new Error('Failed to load scores from MongoDB')

      const data = await response.json()

      if (data.success && data.data) {
        const scoreData = data.data
        const latestDate = new Date(scoreData.date)

        setScores({
          hitCount: scoreData.hitCount,
          totalPossible: scoreData.totalPossible,
          correctCount: scoreData.correctCount,
        })

        setLatestScore(scoreData)

        toast({
          title: 'Tulokset ladattu',
          description: `Viimeisin tulokset ${latestDate.toLocaleDateString('fi-FI')}`,
        })
      }
    } catch (error) {
      console.error('Load scores error:', error)
      toast({
        title: 'Virhe ladatessa',
        description: 'Tulokset lataaminen epäonnistui',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingScores(false)
    }
  }

  const getStatistics = () => {
    if (generatedRows.length === 0) return null

    const stats: { [key: number]: { [key in Outcome]: number } } = {}
    for (let i = 0; i < 13; i++) {
      stats[i + 1] = { '1': 0, 'X': 0, '2': 0 }
    }

    generatedRows.forEach(row => {
      row.picks.forEach((pick, index) => {
        stats[index + 1][pick]++
      })
    })

    return stats
  }

  const stats = getStatistics()

  const copyToClipboard = () => {
    const text = generatedRows
      .map(row => `Rivi ${row.rowNumber}: ${row.picks.join('-')}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    toast({ title: 'Kopioitu leikepöydälle' })
  }

  const downloadCSV = () => {
    // Create Excel-compatible CSV with UTF-8 BOM
    const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility

    // Create header row with game numbers
    const headers = ['Rivi', ...Array.from({ length: 13 }, (_, i) => `Peli ${i + 1}`)]

    // Create data rows
    const rows = generatedRows.map(row => {
      const rowData = [row.rowNumber.toString(), ...row.picks]
      return rowData.join(';')
    })

    // Combine all parts with semicolons (European Excel standard)
    const csvContent = bom + headers.join(';') + '\n' + rows.join('\n')

    // Create blob with proper MIME type
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    })

    // Download the file
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'vakioveikkaus-rivit.csv'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'CSV ladattu',
      description: 'Excel-yhteensopiva CSV-tiedosto luotu',
    })
  }

  const saveToMongoDB = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/mongodb/betsets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName: veikkausData?.game_name,
          sport: veikkausData?.sport,
          poolSize: veikkausData?.pool_size,
          games: games,
          rows: generatedRows,
          totalCost,
        }),
      })

      if (!response.ok) throw new Error('Failed to save to MongoDB')

      const data = await response.json()

      toast({
        title: 'Tallennettu tietokantaan',
        description: `Tallennettu ${data.data?.rowsCount} riviä MongoDB Atlas -tietokantaan`,
      })
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Virhe tallennettaessa',
        description: error instanceof Error ? error.message : 'Tietokantaan tallentaminen epäonnistui',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                Vakioveikkaus Sovellus
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Luo 128 riviä painotetuilla todennäköisyyksillä
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {totalCost} € / 128 riviä
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Games Configuration */}
          <div className="space-y-6">
            {veikkausData && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Upload className="w-5 h-5" />
                    {veikkausData.game_name}
                  </CardTitle>
                  <CardDescription>
                    {veikkausData.sport} • {veikkausData.pool_size}
                    {veikkausData.closing_time && ` • ${veikkausData.closing_time}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Pelien Painoarvot
                </CardTitle>
                <CardDescription>
                  Säädä kunkin pelin todennäköisyyksiä merkeille 1 (koti), X (tasapeli), 2 (vieras)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {games.map((game, index) => (
                      <Card key={game.id} className="p-4">
                        <div className="mb-3">
                          <Label className="font-semibold text-base">
                            Peli {game.gameNumber}: {game.homeTeam} vs {game.awayTeam}
                          </Label>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <Label>1 (Koti)</Label>
                              <Badge variant="secondary">{game.weightHome}%</Badge>
                            </div>
                            <Slider
                              value={[game.weightHome]}
                              onValueChange={(value) => updateWeight(index, 'home', value[0])}
                              max={100}
                              step={1}
                              className="cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <Label>X (Tasapeli)</Label>
                              <Badge variant="secondary">{game.weightDraw}%</Badge>
                            </div>
                            <Slider
                              value={[game.weightDraw]}
                              onValueChange={(value) => updateWeight(index, 'draw', value[0])}
                              max={100}
                              step={1}
                              className="cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <Label>2 (Vieras)</Label>
                              <Badge variant="secondary">{game.weightAway}%</Badge>
                            </div>
                            <Slider
                              value={[game.weightAway]}
                              onValueChange={(value) => updateWeight(index, 'away', value[0])}
                              max={100}
                              step={1}
                              className="cursor-pointer"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="json-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                variant="outline"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Tuodaan...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Tuo JSON-tiedosto
                  </>
                )}
              </Button>

              <Button
                onClick={generateRows}
                disabled={isGenerating}
                className="flex-1 text-lg h-12"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Luodaan rivejä...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Luo 128 Riviä
                  </>
                )}
              </Button>

              {generatedRows.length > 0 && (
                <>
                  <Button onClick={saveToMongoDB} disabled={isSaving} variant="outline" size="lg">
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Tallennetaan...
                      </>
                    ) : (
                      <>
                        <Database className="w-5 h-5 mr-2" />
                        Tallenna tietokantaan
                      </>
                    )}
                  </Button>
                  <Button onClick={downloadCSV} variant="outline" size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    CSV
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Generated Rows, Statistics, and Scores */}
          <div className="space-y-6 flex flex-col">
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Tilastot</CardTitle>
                  <CardDescription>
                    Merkkien jakaumat jokaisessa pelissä
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {Object.entries(stats).map(([gameNumber, counts]) => (
                        <div key={gameNumber} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <Badge variant="outline" className="min-w-[60px] justify-center">
                            Peli {gameNumber}
                          </Badge>
                          <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-lg">{counts['1']}</div>
                              <div className="text-slate-600 dark:text-slate-400">1</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg">{counts['X']}</div>
                              <div className="text-slate-600 dark:text-slate-400">X</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg">{counts['2']}</div>
                              <div className="text-slate-600 dark:text-slate-400">2</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {generatedRows.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Generoidut Rivit ({generatedRows.length})</CardTitle>
                  <CardDescription>
                    128 riviä generoitu painotetuilla todennäköisyyksillä
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {generatedRows.map((row) => (
                        <div
                          key={row.rowNumber}
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Badge variant="outline" className="min-w-[80px] justify-center font-mono">
                            #{row.rowNumber}
                          </Badge>
                          <div className="flex-1 flex gap-1">
                            {row.picks.map((pick, index) => (
                              <Badge
                                key={index}
                                variant={
                                  pick === '1'
                                    ? 'default'
                                    : pick === 'X'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className={`w-8 h-8 flex items-center justify-center font-bold ${
                                  pick === '1'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : pick === 'X'
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                {pick}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>Vakioveikkaus-sovellus • Generoi 128 riviä painotetuilla todennäköisyyksillä</p>
          <p className="mt-1">Yhteensä 32 € (128 × 0,25 € per rivi)</p>
        </div>
      </footer>
    </div>
  )
}
