import React from "react";
import { Button } from "@/components/ui/button";

export const Toolbox = () => {
    return (
        <div className="w-64 h-screen bg-gray-100">
            <div className="p-4">
                <h1 className="text-2xl font-bold">Toolbox</h1>
            </div>
            <div className="p-4">
                <Button>Button</Button>
            </div>
            <div className="p-4">
                <Button>Text</Button>
            </div>
            <div className="p-4">
                <Button>Container</Button>
            </div>
            <div className="p-4">
                <Button>Card</Button>
            </div>
        </div>
    )
}