import { LogOut } from "lucide-react";

import { Settings } from "lucide-react";

import { Bell } from "lucide-react";

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-blue-600">G4IT</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                        </button>
                        <button className="p-2 text-gray-500 hover:text-gray-700">
                            <Settings className="h-5 w-5" />
                        </button>
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                U
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden sm:block">Utilisateur</span>
                        </div>
                        <button className="p-2 text-gray-500 hover:text-gray-700">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
