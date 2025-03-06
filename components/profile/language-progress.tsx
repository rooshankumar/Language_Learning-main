"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function LanguageProgress() {
  // Mock data - in a real app, this would come from your database
  const vocabularyWords = [
    { word: "Bonjour", translation: "Hello", mastered: true },
    { word: "Merci", translation: "Thank you", mastered: true },
    { word: "S'il vous plaît", translation: "Please", mastered: false },
    { word: "Au revoir", translation: "Goodbye", mastered: false },
    { word: "Comment ça va?", translation: "How are you?", mastered: true },
  ]

  const grammarRules = [
    { rule: "Present Tense", description: "Basic verb conjugation", mastered: true },
    { rule: "Gender Agreement", description: "Matching adjectives with nouns", mastered: false },
    { rule: "Articles", description: "Using le, la, les, un, une, des", mastered: true },
    { rule: "Negation", description: "Using ne...pas structure", mastered: false },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Language Progress</h3>
        <p className="text-sm text-muted-foreground">Track your language learning journey</p>
      </div>
      <Tabs defaultValue="vocabulary">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="grammar">Grammar</TabsTrigger>
        </TabsList>
        <TabsContent value="vocabulary">
          <Card>
            <CardHeader>
              <CardTitle>Vocabulary Progress</CardTitle>
              <CardDescription>Words and phrases you've learned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {vocabularyWords.map((item, index) => (
                  <div key={index} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.word}</p>
                      <p className="text-sm text-muted-foreground">{item.translation}</p>
                    </div>
                    <div className={`h-3 w-3 rounded-full ${item.mastered ? "bg-green-500" : "bg-amber-500"}`}></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="grammar">
          <Card>
            <CardHeader>
              <CardTitle>Grammar Progress</CardTitle>
              <CardDescription>Grammar rules you've learned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {grammarRules.map((item, index) => (
                  <div key={index} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.rule}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className={`h-3 w-3 rounded-full ${item.mastered ? "bg-green-500" : "bg-amber-500"}`}></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}