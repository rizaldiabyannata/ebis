"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

// We can't get the spec directly in a client component easily,
// so we'll just point the UI to the API route that serves it.
function ApiDocsPage() {
  return (
    <section className="p-4">
        <SwaggerUI url="/api/docs" />
    </section>
  )
}

export default ApiDocsPage;
