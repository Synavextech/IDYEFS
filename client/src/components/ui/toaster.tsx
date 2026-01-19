import * as React from "react"
import { cn } from "@/lib/utils"

const Toaster = () => {
    return (
        <div id="toaster" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {/* Toast notifications will be rendered here */}
        </div>
    )
}

export { Toaster }
