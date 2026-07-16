"use client";

import { EnrollmentOnboarding } from "@/components/mdm";

export default function EnrollmentPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enrollment</h1>
        <p className="text-muted-foreground">
          Onboard Android devices with QR provisioning or manual enrollment
        </p>
      </div>

      <EnrollmentOnboarding />
    </div>
  );
}