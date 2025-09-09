"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Star, Search, Calendar, DollarSign, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SellerReview {
  id: string
  rating: number
  sellerCommunication: number
  qualityOfDelivery: number
  valueOfDelivery: number
  comment?: string
  createdAt: string
  purchaseAmount: number
  deliveryTime: string
  buyer: {
    firstName: string
    lastName: string
    country: string
  }
  order: {
    tierName: string
  }
}

interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  categoryAverages: {
    sellerCommunication: number
    qualityOfDelivery: number
    valueOfDelivery: number
  }
}

// Mock data for demonstration
const mockReviews: SellerReview[] = [
  {
    id: "1",
    rating: 5,
    sellerCommunication: 5,
    qualityOfDelivery: 5,
    valueOfDelivery: 5,
    comment:
      "Absolutely fantastic! This is my third project with this seller and they never disappoint. Fast delivery, excellent communication, and top-quality work every time.",
    createdAt: "2024-01-15T10:30:00Z",
    purchaseAmount: 200,
    deliveryTime: "1 day",
    buyer: { firstName: "Lisa", lastName: "Thompson", country: "Australia" },
    order: { tierName: "Standard" },
  },
  {
    id: "2",
    rating: 4,
    sellerCommunication: 4,
    qualityOfDelivery: 5,
    valueOfDelivery: 4,
    comment:
      "Good value for money. The work was completed as requested and the seller was helpful with revisions. Would work with them again.",
    createdAt: "2024-01-28T14:20:00Z",
    purchaseAmount: 75,
    deliveryTime: "2 days",
    buyer: { firstName: "James", lastName: "Wilson", country: "United Kingdom" },
    order: { tierName: "Basic" },
  },
  {
    id: "3",
    rating: 5,
    sellerCommunication: 5,
    qualityOfDelivery: 5,
    valueOfDelivery: 5,
    comment:
      "Outstanding work on our SaaS dashboard. Sarah's attention to detail and understanding of user experience is remarkable. The new design has made our complex data much more accessible to users.",
    createdAt: "2024-02-05T09:15:00Z",
    purchaseAmount: 450,
    deliveryTime: "3 days",
    buyer: { firstName: "Michael", lastName: "Chen", country: "United States" },
    order: { tierName: "Premium" },
  },
  {
    id: "4",
    rating: 5,
    sellerCommunication: 5,
    qualityOfDelivery: 5,
    valueOfDelivery: 5,
    comment:
      "Perfect brand identity work! Sarah created a cohesive visual system that perfectly represents our company values. The logo and brand guidelines exceeded our expectations.",
    createdAt: "2024-02-12T16:45:00Z",
    purchaseAmount: 350,
    deliveryTime: "4 days",
    buyer: { firstName: "David", lastName: "Park", country: "Canada" },
    order: { tierName: "Standard" },
  },
  {
    id: "5",
    rating: 4,
    sellerCommunication: 4,
    qualityOfDelivery: 4,
    valueOfDelivery: 4,
    comment:
      "Great mobile app design. Clean, modern interface that our users love. Communication was clear throughout the project.",
    createdAt: "2024-02-18T11:30:00Z",
    purchaseAmount: 180,
    deliveryTime: "2 days",
    buyer: { firstName: "Emma", lastName: "Rodriguez", country: "Spain" },
    order: { tierName: "Basic" },
  },
  {
    id: "6",
    rating: 5,
    sellerCommunication: 5,
    qualityOfDelivery: 5,
    valueOfDelivery: 5,
    comment:
      "Incredible website redesign! The new layout is so much more user-friendly and the visual design is stunning. Highly recommend!",
    createdAt: "2024-02-25T13:20:00Z",
    purchaseAmount: 600,
    deliveryTime: "5 days",
    buyer: { firstName: "Alex", lastName: "Johnson", country: "United States" },
    order: { tierName: "Premium" },
  },
]

const mockStats: ReviewStats = {
  totalReviews: 6,
  averageRating: 4.7,
  ratingBreakdown: { 5: 5, 4: 1, 3: 0, 2: 0, 1: 0 },
  categoryAverages: {
    sellerCommunication: 4.7,
    qualityOfDelivery: 4.8,
    valueOfDelivery: 4.7,
  },
}

interface SellerReviewsSectionProps {
  sellerId: string
}

export function SellerReviewsSection({ sellerId }: SellerReviewsSectionProps) {
  const [reviews, setReviews] = useState<SellerReview[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"most_recent" | "most_relevant" | "highest_rating" | "lowest_rating">(
    "most_recent",
  )
  const [displayedReviewsCount, setDisplayedReviewsCount] = useState(5)
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null)
  const REVIEWS_PER_PAGE = 5

  useEffect(() => {
    setReviews(mockReviews)
    setReviewStats(mockStats)
    setLoading(false)
  }, [sellerId, searchTerm, sortBy])

  const StarRating = ({ value, readonly = true }: { value: number; readonly?: boolean }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-4 w-4 ${star <= value ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
      ))}
    </div>
  )

  const handleShowMoreReviews = () => {
    setDisplayedReviewsCount((prev) => prev + REVIEWS_PER_PAGE)
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      searchTerm === "" ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${review.buyer.firstName} ${review.buyer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStarFilter = selectedStarFilter === null || review.rating === selectedStarFilter

    return matchesSearch && matchesStarFilter
  })

  const handleStarFilterClick = (stars: number) => {
    if (selectedStarFilter === stars) {
      setSelectedStarFilter(null)
    } else {
      setSelectedStarFilter(stars)
    }
    setDisplayedReviewsCount(REVIEWS_PER_PAGE)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="flex-1 h-2 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-xl">Reviews</CardTitle>
            {reviewStats && reviewStats.totalReviews > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                  <span className="font-bold text-lg">{reviewStats.averageRating}</span>
                  <span className="text-gray-600 ml-1">•</span>
                  <span className="font-medium text-gray-700 ml-1">
                    {reviewStats.totalReviews.toLocaleString()} review{reviewStats.totalReviews !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {reviewStats && reviewStats.totalReviews > 0 && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div
                  key={stars}
                  className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all duration-200 ${
                    selectedStarFilter === stars ? "bg-emerald-50 border border-emerald-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleStarFilterClick(stars)}
                >
                  <span
                    className={`text-sm font-medium w-12 ${
                      selectedStarFilter === stars ? "text-emerald-700" : "text-gray-700"
                    }`}
                  >
                    {stars} stars
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        selectedStarFilter === stars ? "bg-emerald-600" : "bg-gray-800"
                      }`}
                      style={{
                        width: `${reviewStats.totalReviews > 0 ? (reviewStats.ratingBreakdown[stars as keyof typeof reviewStats.ratingBreakdown] / reviewStats.totalReviews) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className={`text-sm font-medium w-12 text-right ${
                      selectedStarFilter === stars ? "text-emerald-600" : "text-green-600"
                    }`}
                  >
                    ({reviewStats.ratingBreakdown[stars as keyof typeof reviewStats.ratingBreakdown]})
                  </span>
                </div>
              ))}
              {selectedStarFilter !== null && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStarFilter(null)}
                  className="w-full mt-2 text-gray-600 hover:text-gray-800"
                >
                  Show All Reviews
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Rating breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Seller communication level</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{reviewStats.categoryAverages.sellerCommunication}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quality of delivery</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{reviewStats.categoryAverages.qualityOfDelivery}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Value of delivery</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{reviewStats.categoryAverages.valueOfDelivery}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reviewStats && reviewStats.totalReviews > 0 && <Separator />}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reviews"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="most_recent">Most recent</SelectItem>
              <SelectItem value="most_relevant">Most relevant</SelectItem>
              <SelectItem value="highest_rating">Highest rating</SelectItem>
              <SelectItem value="lowest_rating">Lowest rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedStarFilter !== null && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-emerald-600 fill-current" />
              <span className="text-sm text-emerald-700 font-medium">
                Showing {selectedStarFilter}-star reviews ({filteredReviews.length} found)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedStarFilter(null)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
            >
              Clear Filter
            </Button>
          </div>
        )}

        {filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.slice(0, displayedReviewsCount).map((review) => (
              <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                        {review.buyer.firstName[0]}
                        {review.buyer.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {review.buyer.firstName} {review.buyer.lastName}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>🇺🇸 {review.buyer.country}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <StarRating value={review.rating} />
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {review.comment && <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.comment}</p>}

                <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="font-medium">${review.purchaseAmount}</span>
                      <span className="text-gray-500 ml-1">Price</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="font-medium">{review.deliveryTime}</span>
                      <span className="text-gray-500 ml-1">Duration</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {review.order.tierName}
                  </Badge>
                </div>
              </div>
            ))}

            {filteredReviews.length > displayedReviewsCount && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={handleShowMoreReviews} className="px-8 py-2 bg-transparent">
                  Show More Reviews
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStarFilter !== null ? `No ${selectedStarFilter}-star reviews found` : "No reviews yet"}
            </h3>
            <p className="text-gray-600">
              {selectedStarFilter !== null
                ? "Try selecting a different star rating or clearing the filter."
                : "Only buyers who have completed orders can write reviews."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
