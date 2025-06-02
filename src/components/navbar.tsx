import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"

export function Navbar() {
  return (
    <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <Avatar className="w-8 h-8">
        <AvatarImage src="/placeholder-user.jpg" />
        <AvatarFallback className="bg-gray-600 text-white text-xs">JD</AvatarFallback>
      </Avatar>
    </div>
  )
}
