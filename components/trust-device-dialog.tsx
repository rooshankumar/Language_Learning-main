"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function TrustDeviceDialog({ onConfirm }: { onConfirm: (trustDevice: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if we've already shown this dialog
    const hasShownDialog = localStorage.getItem("trust_device_dialog_shown")

    if (!hasShownDialog) {
      setOpen(true)
    }
  }, [])

  const handleConfirm = () => {
    // Save the user's preference
    if (trustDevice) {
      localStorage.setItem("trust_device", "true")
      toast({
        title: "Device trusted",
        description: "You will stay signed in on this device.",
      })
    } else {
      localStorage.setItem("trust_device", "false");
    }

    // Mark that we've shown the dialog
    localStorage.setItem("trust_device_dialog_shown", "true")

    onConfirm(trustDevice)
    setOpen(false)
  }

  const handleCancel = () => {
    localStorage.setItem("trust_device_dialog_shown", "true")
    localStorage.setItem("trust_device", "false"); //Added to ensure false is stored on cancel
    onConfirm(false)
    setOpen(false)
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Trust this device?</AlertDialogTitle>
          <AlertDialogDescription>
            Would you like to stay signed in on this device? This will keep you logged in for future visits.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="trust-device"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
          />
          <Label htmlFor="trust-device">Trust this device and stay signed in</Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}