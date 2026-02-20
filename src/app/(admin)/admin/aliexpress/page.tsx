import { AliexpressSearch } from "./AliexpressSearch";

export default function AliExpressPage() {
  const isConfigured = !!(
    process.env.ALIEXPRESS_APP_KEY &&
    process.env.ALIEXPRESS_APP_SECRET &&
    process.env.ALIEXPRESS_TRACKING_ID
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AliExpress Import</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search AliExpress products and import them into your catalog queue.
        </p>
      </div>

      {!isConfigured && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-1">Setup Required</p>
          <p>
            Add the following environment variables to enable AliExpress Import:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside font-mono text-xs">
            <li>ALIEXPRESS_APP_KEY</li>
            <li>ALIEXPRESS_APP_SECRET</li>
            <li>ALIEXPRESS_TRACKING_ID</li>
          </ul>
          <p className="mt-2">
            Sign up at{" "}
            <a
              href="https://portals.aliexpress.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-900"
            >
              portals.aliexpress.com
            </a>{" "}
            → create an App to get your credentials.
          </p>
        </div>
      )}

      <AliexpressSearch />
    </div>
  );
}
