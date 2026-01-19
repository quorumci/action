import type { HttpMethod, HttpJobConfig, WebhookJobConfig, ScriptJobConfig, ScriptRuntime, DnsJobConfig, DnsRecordType, TlsJobConfig, QuorumConfig } from '@quorumci/core';
export interface ActionInputs {
    type: 'http' | 'webhook' | 'script' | 'dns' | 'tls';
    url?: string;
    method?: HttpMethod;
    body?: string;
    endpoint?: string;
    payload?: unknown;
    script?: string;
    scriptFile?: string;
    runtime?: ScriptRuntime;
    scriptArgs?: string[];
    scriptEnv?: Record<string, string>;
    hostname?: string;
    recordType?: DnsRecordType;
    expectedValues?: string[];
    nameserver?: string;
    port?: number;
    minDaysValid?: number;
    expectedIssuer?: string;
    headers?: Record<string, string>;
    expectedStatus: number | number[];
    executions: number;
    quorum: number;
    timeoutMs: number;
}
export declare function getInputs(): ActionInputs;
export declare function toHttpJobConfig(inputs: ActionInputs): HttpJobConfig;
export declare function toWebhookJobConfig(inputs: ActionInputs): WebhookJobConfig;
export declare function toScriptJobConfig(inputs: ActionInputs): Promise<ScriptJobConfig>;
export declare function toDnsJobConfig(inputs: ActionInputs): DnsJobConfig;
export declare function toTlsJobConfig(inputs: ActionInputs): TlsJobConfig;
export declare function toQuorumConfig(inputs: ActionInputs): QuorumConfig;
//# sourceMappingURL=inputs.d.ts.map