import * as core from '@actions/core';
export async function writeSummary(result, inputs) {
    const verdictEmoji = result.verdict === 'pass' ? '✅' : result.verdict === 'fail' ? '❌' : '⚠️';
    const verdictText = result.verdict.toUpperCase();
    await core.summary
        .addHeading(`${verdictEmoji} Quorum ${verdictText}`, 2)
        .addTable([
        [
            { data: 'Metric', header: true },
            { data: 'Value', header: true },
        ],
        ['Agreement', `${String(result.agreementCount)}/${String(result.totalExecutions)}`],
        ['Required', String(result.requiredAgreement)],
        ['Quorum Met', result.quorumMet ? 'Yes' : 'No'],
        ['Duration', `${String(result.durationMs)}ms`],
        ...(result.consensusHash !== undefined
            ? [['Consensus Hash', `\`${result.consensusHash.slice(0, 16)}...\``]]
            : []),
    ])
        .addHeading('Configuration', 3)
        .addTable([
        [
            { data: 'Setting', header: true },
            { data: 'Value', header: true },
        ],
        ['Type', inputs.type],
        ...(inputs.type === 'http'
            ? [
                ['URL', inputs.url ?? '-'],
                ['Method', inputs.method ?? '-'],
            ]
            : [['Endpoint', inputs.endpoint ?? '-']]),
        ['Expected Status', String(inputs.expectedStatus)],
        ['Timeout', String(inputs.timeoutMs) + 'ms'],
    ])
        .addHeading('Executions', 3)
        .addTable([
        [
            { data: 'Processor', header: true },
            { data: 'Status', header: true },
            { data: 'Code', header: true },
            { data: 'Latency', header: true },
            { data: 'Hash', header: true },
        ],
        ...result.executions.map((exec) => formatExecutionRow(exec)),
    ])
        .write();
}
function formatExecutionRow(exec) {
    const statusEmoji = exec.status === 'success'
        ? '🟢'
        : exec.status === 'failure'
            ? '🔴'
            : exec.status === 'timeout'
                ? '🟡'
                : '⚪';
    return [
        exec.processorId,
        `${statusEmoji} ${exec.status}`,
        exec.statusCode !== undefined ? String(exec.statusCode) : '-',
        `${String(exec.latencyMs)}ms`,
        exec.responseHash ? `\`${exec.responseHash.slice(0, 8)}\`` : '-',
    ];
}
//# sourceMappingURL=summary.js.map