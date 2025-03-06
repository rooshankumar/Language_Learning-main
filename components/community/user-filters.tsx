"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface FiltersState {
  language: string
  interests: string[]
}

interface UserFiltersProps {
  onFilterChange: (filters: FiltersState) => void
}

// Example interests - in a real app, these might come from your database
const INTERESTS = [
  "Music",
  "Movies",
  "Books",
  "Sports",
  "Travel",
  "Food",
  "Art",
  "Technology",
  "Gaming",
  "Photography"
]

// Example languages - in a real app, these might come from your database
const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
  "Arabic"
]

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [filters, setFilters] = useState<FiltersState>({
    language: "all", // Initialize with "all" to avoid initial error
    interests: [],
  })

  // Report filter changes to parent component
  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  // Toggle an interest in the filter
  const toggleInterest = (interest: string) => {
    setFilters(prev => {
      if (prev.interests.includes(interest)) {
        return {
          ...prev,
          interests: prev.interests.filter(i => i !== interest)
        }
      } else {
        return {
          ...prev,
          interests: [...prev.interests, interest]
        }
      }
    })
  }

  // Update language filter
  const handleLanguageChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      language: value
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      language: "all", // Reset to "all"
      interests: []
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Filters</span>
          {(filters.language !== "all" || filters.interests.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-8 text-xs"
            >
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language filter */}
        <div>
          <h3 className="text-sm font-medium mb-2">Language</h3>
          <Select 
            value={filters.language} 
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {LANGUAGES.map(language => (
                <SelectItem key={language} value={language}>{language}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Interests filter */}
        <div>
          <h3 className="text-sm font-medium mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <Badge 
                key={interest}
                variant={filters.interests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
                {filters.interests.includes(interest) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}