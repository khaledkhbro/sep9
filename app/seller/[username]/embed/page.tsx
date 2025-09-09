import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Clock } from "lucide-react"

export default async function SellerEmbedPage({
  params,
}: {
  params: { username: string }
}) {
  // Mock data - replace with actual database query
  const seller = {
    id: 1,
    username: params.username,
    name: "Sarah Johnson",
    title: "Professional Logo Designer",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4.9,
    reviewCount: 248,
    location: "New York, USA",
    responseTime: "1 hour",
    skills: ["Logo Design", "Brand Identity", "Graphic Design"],
    completedOrders: 1250,
    memberSince: "2020",
  }

  if (!seller) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarImage src={seller.avatar || "/placeholder.svg"} alt={seller.name} />
            <AvatarFallback>
              {seller.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-xl font-bold text-gray-900 mb-1">{seller.name}</h1>
          <p className="text-gray-600 mb-3">{seller.title}</p>

          <div className="flex items-center justify-center gap-1 mb-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{seller.rating}</span>
            <span className="text-gray-500">({seller.reviewCount} reviews)</span>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {seller.location}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {seller.responseTime}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{seller.completedOrders}</div>
            <div className="text-sm text-gray-600">Orders Completed</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{seller.memberSince}</div>
            <div className="text-sm text-gray-600">Member Since</div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {seller.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href={`/seller/${seller.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            View Full Profile
          </a>
        </div>
      </div>
    </div>
  )
}
