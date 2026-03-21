import { useState, useMemo } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { TabBar } from "../../components/ui/TabBar";
import { Badge } from "../../components/ui/Badge";
import { decodeJwt, getExpiry, getAlgorithm } from "./jwt.utils";
import { highlightJson } from "../json/json.utils";
import type { ToolProps } from "../registry";

const SAMPLE_DATA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.4S2sL4Hk_RKhp3oK5cE3MFg6_lNxlFvKBVDlH8a9MJc";

const TABS = ["Header", "Payload", "Info"] as const;

export function JwtDecoder({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Header");

  const decoded = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return decodeJwt({ token: input });
    } catch {
      return null;
    }
  }, [input]);

  const error = input.trim() && !decoded ? "Invalid JWT token" : undefined;

  const outputText = useMemo(() => {
    if (!decoded) return "";
    if (activeTab === "Header") return JSON.stringify(decoded.header, null, 2);
    if (activeTab === "Payload") return JSON.stringify(decoded.payload, null, 2);
    return "";
  }, [decoded, activeTab]);

  const outputElement = useMemo(() => {
    if (!decoded) return undefined;

    const infoContent = (
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 w-20">Algorithm</span>
          <Badge variant="info">{getAlgorithm({ header: decoded.header })}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 w-20">Expiry</span>
          {(() => {
            const expiry = getExpiry({ payload: decoded.payload });
            return <Badge variant={expiry.isExpired ? "error" : "success"}>{expiry.timeRemaining}</Badge>;
          })()}
        </div>
        {(() => {
          const expiry = getExpiry({ payload: decoded.payload });
          return expiry.expiresAt ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-20">Expires at</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {expiry.expiresAt.toISOString()}
              </span>
            </div>
          ) : null;
        })()}
        {typeof decoded.payload.iat === "number" && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 w-20">Issued at</span>
            <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
              {new Date((decoded.payload.iat as number) * 1000).toISOString()}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 w-20">Signature</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
            Cannot verify without secret
          </span>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col h-full">
        <TabBar tabs={[...TABS]} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto p-3">
          {activeTab === "Info" ? (
            infoContent
          ) : (
            <pre
              className="text-sm font-mono whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: highlightJson({ json: outputText }) }}
            />
          )}
        </div>
      </div>
    );
  }, [decoded, activeTab, outputText]);

  return (
    <ToolPane
      inputValue={input}
      onInputChange={setInput}
      outputValue={outputText}
      outputElement={outputElement}
      sampleData={SAMPLE_DATA}
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      placeholder="Paste a JWT token to decode..."
      actions={[]}
      error={error}
    />
  );
}
