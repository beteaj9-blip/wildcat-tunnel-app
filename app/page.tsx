import React, { Suspense } from "react";
import GradePortal from "./GradePortalClient";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <GradePortal />
    </Suspense>
  );
}