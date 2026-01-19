import * as core from '@actions/core';
function parseExpectedStatus(value) {
    if (value.includes(',')) {
        return value
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 200 : parsed;
}
function parseHeaders(value) {
    if (!value) {
        return undefined;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        core.warning(`Failed to parse headers as JSON: ${value}`);
        return undefined;
    }
}
function parsePayload(value) {
    if (!value) {
        return {};
    }
    try {
        return JSON.parse(value);
    }
    catch {
        core.warning('Failed to parse payload as JSON: ' + value);
        return {};
    }
}
function parseScriptArgs(value) {
    if (!value) {
        return undefined;
    }
    return value.split(',').map((s) => s.trim());
}
function parseScriptEnv(value) {
    if (!value) {
        return undefined;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        core.warning('Failed to parse script-env as JSON: ' + value);
        return undefined;
    }
}
function parseExpectedValues(value) {
    if (!value) {
        return undefined;
    }
    return value.split(',').map((s) => s.trim());
}
const VALID_DNS_RECORD_TYPES = [
    'A',
    'AAAA',
    'CNAME',
    'MX',
    'TXT',
    'NS',
    'SOA',
    'PTR',
];
export function getInputs() {
    const type = core.getInput('type', { required: true });
    if (type !== 'http' &&
        type !== 'webhook' &&
        type !== 'script' &&
        type !== 'dns' &&
        type !== 'tls') {
        throw new Error('Invalid type: ' + type + ". Must be 'http', 'webhook', 'script', 'dns', or 'tls'");
    }
    // HTTP-specific validation
    const url = core.getInput('url') || undefined;
    if (type === 'http' && !url) {
        throw new Error('url is required for http job type');
    }
    // Webhook-specific validation
    const endpoint = core.getInput('endpoint') || undefined;
    if (type === 'webhook' && !endpoint) {
        throw new Error('endpoint is required for webhook job type');
    }
    // Script-specific validation
    const script = core.getInput('script') || undefined;
    const scriptFile = core.getInput('script-file') || undefined;
    if (type === 'script' && !script && !scriptFile) {
        throw new Error('Either script or script-file is required for script job type');
    }
    // DNS-specific validation
    const hostname = core.getInput('hostname') || undefined;
    if (type === 'dns' && !hostname) {
        throw new Error('hostname is required for dns job type');
    }
    // TLS-specific validation
    if (type === 'tls' && !hostname) {
        throw new Error('hostname is required for tls job type');
    }
    const methodInput = core.getInput('method').toUpperCase();
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'];
    const method = validMethods.includes(methodInput)
        ? methodInput
        : undefined;
    if (type === 'http' && !method) {
        throw new Error('Invalid method: ' + methodInput);
    }
    const headersInput = core.getInput('headers');
    const headers = parseHeaders(headersInput);
    const body = core.getInput('body') || undefined;
    const payloadInput = core.getInput('payload');
    const payload = payloadInput ? parsePayload(payloadInput) : undefined;
    const expectedStatus = parseExpectedStatus(core.getInput('expected-status'));
    const executions = parseInt(core.getInput('executions'), 10);
    if (isNaN(executions) || executions < 1) {
        throw new Error('executions must be a positive number');
    }
    const quorum = parseInt(core.getInput('quorum'), 10);
    if (isNaN(quorum) || quorum < 1) {
        throw new Error('quorum must be a positive number');
    }
    if (quorum > executions) {
        throw new Error('quorum (' +
            String(quorum) +
            ') cannot be greater than executions (' +
            String(executions) +
            ')');
    }
    const timeoutMs = parseInt(core.getInput('timeout-ms'), 10);
    if (isNaN(timeoutMs) || timeoutMs < 1) {
        throw new Error('timeout-ms must be a positive number');
    }
    const result = {
        type,
        expectedStatus,
        executions,
        quorum,
        timeoutMs,
    };
    // HTTP fields
    if (url !== undefined) {
        result.url = url;
    }
    if (method !== undefined) {
        result.method = method;
    }
    if (body !== undefined) {
        result.body = body;
    }
    // Webhook fields
    if (endpoint !== undefined) {
        result.endpoint = endpoint;
    }
    if (payload !== undefined) {
        result.payload = payload;
    }
    // Script fields
    if (script !== undefined) {
        result.script = script;
    }
    if (scriptFile !== undefined) {
        result.scriptFile = scriptFile;
    }
    const runtimeInput = core.getInput('runtime') || undefined;
    if (runtimeInput !== undefined) {
        if (runtimeInput !== 'node' && runtimeInput !== 'bash') {
            throw new Error('Invalid runtime: ' + runtimeInput + ". Must be 'node' or 'bash'");
        }
        result.runtime = runtimeInput;
    }
    const scriptArgsInput = core.getInput('script-args');
    const scriptArgs = parseScriptArgs(scriptArgsInput);
    if (scriptArgs !== undefined) {
        result.scriptArgs = scriptArgs;
    }
    const scriptEnvInput = core.getInput('script-env');
    const scriptEnv = parseScriptEnv(scriptEnvInput);
    if (scriptEnv !== undefined) {
        result.scriptEnv = scriptEnv;
    }
    // DNS fields
    if (hostname !== undefined) {
        result.hostname = hostname;
    }
    const recordTypeInput = core.getInput('record-type').toUpperCase() || undefined;
    if (recordTypeInput !== undefined) {
        if (!VALID_DNS_RECORD_TYPES.includes(recordTypeInput)) {
            throw new Error('Invalid record-type: ' +
                recordTypeInput +
                '. Must be one of: ' +
                VALID_DNS_RECORD_TYPES.join(', '));
        }
        result.recordType = recordTypeInput;
    }
    const expectedValuesInput = core.getInput('expected-values');
    const expectedValues = parseExpectedValues(expectedValuesInput);
    if (expectedValues !== undefined) {
        result.expectedValues = expectedValues;
    }
    const nameserver = core.getInput('nameserver') || undefined;
    if (nameserver !== undefined) {
        result.nameserver = nameserver;
    }
    // TLS fields
    const portInput = core.getInput('port');
    if (portInput) {
        const port = parseInt(portInput, 10);
        if (!isNaN(port) && port > 0) {
            result.port = port;
        }
    }
    const minDaysValidInput = core.getInput('min-days-valid');
    if (minDaysValidInput) {
        const minDaysValid = parseInt(minDaysValidInput, 10);
        if (!isNaN(minDaysValid) && minDaysValid >= 0) {
            result.minDaysValid = minDaysValid;
        }
    }
    const expectedIssuer = core.getInput('expected-issuer') || undefined;
    if (expectedIssuer !== undefined) {
        result.expectedIssuer = expectedIssuer;
    }
    // Common fields
    if (headers !== undefined) {
        result.headers = headers;
    }
    return result;
}
export function toHttpJobConfig(inputs) {
    if (!inputs.url) {
        throw new Error('url is required for http job type');
    }
    if (!inputs.method) {
        throw new Error('method is required for http job type');
    }
    const config = {
        type: 'http',
        url: inputs.url,
        method: inputs.method,
        expectedStatus: inputs.expectedStatus,
        timeoutMs: inputs.timeoutMs,
    };
    if (inputs.headers !== undefined) {
        config.headers = inputs.headers;
    }
    if (inputs.body !== undefined) {
        config.body = inputs.body;
    }
    return config;
}
export function toWebhookJobConfig(inputs) {
    if (!inputs.endpoint) {
        throw new Error('endpoint is required for webhook job type');
    }
    const config = {
        type: 'webhook',
        endpoint: inputs.endpoint,
        payload: inputs.payload ?? {},
        expectedStatus: inputs.expectedStatus,
        timeoutMs: inputs.timeoutMs,
    };
    if (inputs.headers !== undefined) {
        config.headers = inputs.headers;
    }
    return config;
}
export async function toScriptJobConfig(inputs) {
    let scriptContent;
    if (inputs.script !== undefined) {
        scriptContent = inputs.script;
    }
    else if (inputs.scriptFile !== undefined) {
        const { readFile } = await import('node:fs/promises');
        scriptContent = await readFile(inputs.scriptFile, 'utf-8');
    }
    else {
        throw new Error('Either script or script-file is required for script job type');
    }
    const config = {
        type: 'script',
        runtime: inputs.runtime ?? 'node',
        script: scriptContent,
        timeoutMs: inputs.timeoutMs,
    };
    if (inputs.scriptArgs !== undefined) {
        config.args = inputs.scriptArgs;
    }
    if (inputs.scriptEnv !== undefined) {
        config.env = inputs.scriptEnv;
    }
    return config;
}
export function toDnsJobConfig(inputs) {
    if (!inputs.hostname) {
        throw new Error('hostname is required for dns job type');
    }
    const config = {
        type: 'dns',
        hostname: inputs.hostname,
        recordType: inputs.recordType ?? 'A',
        timeoutMs: inputs.timeoutMs,
    };
    if (inputs.expectedValues !== undefined) {
        config.expectedValues = inputs.expectedValues;
    }
    if (inputs.nameserver !== undefined) {
        config.nameserver = inputs.nameserver;
    }
    return config;
}
export function toTlsJobConfig(inputs) {
    if (!inputs.hostname) {
        throw new Error('hostname is required for tls job type');
    }
    const config = {
        type: 'tls',
        hostname: inputs.hostname,
        timeoutMs: inputs.timeoutMs,
    };
    if (inputs.port !== undefined) {
        config.port = inputs.port;
    }
    if (inputs.minDaysValid !== undefined) {
        config.minDaysValid = inputs.minDaysValid;
    }
    if (inputs.expectedIssuer !== undefined) {
        config.expectedIssuer = inputs.expectedIssuer;
    }
    return config;
}
export function toQuorumConfig(inputs) {
    return {
        executions: inputs.executions,
        required: inputs.quorum,
    };
}
//# sourceMappingURL=inputs.js.map