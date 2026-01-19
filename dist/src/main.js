import * as core from '@actions/core';
import { randomUUID } from 'node:crypto';
import { HttpJobRunner, WebhookJobRunner, ScriptJobRunner, DnsJobRunner, TlsJobRunner, QuorumAggregator, } from '@quorumci/core';
import { getInputs, toHttpJobConfig, toWebhookJobConfig, toScriptJobConfig, toDnsJobConfig, toTlsJobConfig, toQuorumConfig, } from './inputs.js';
import { setOutputs } from './outputs.js';
import { writeSummary } from './summary.js';
async function run() {
    try {
        const inputs = getInputs();
        const quorumConfig = toQuorumConfig(inputs);
        const aggregator = new QuorumAggregator();
        const jobId = randomUUID();
        const startTime = Date.now();
        const results = [];
        if (inputs.type === 'http') {
            const jobConfig = toHttpJobConfig(inputs);
            const runner = new HttpJobRunner();
            core.info('Running ' +
                String(inputs.executions) +
                ' executions against ' +
                (inputs.url ?? '') +
                '...');
            for (let i = 0; i < inputs.executions; i++) {
                const result = await runner.execute(jobConfig, { processorId: 'local-' + String(i + 1) });
                results.push(result);
                core.info('  Execution ' + String(i + 1) + ': ' + result.status);
            }
        }
        else if (inputs.type === 'webhook') {
            const jobConfig = toWebhookJobConfig(inputs);
            const runner = new WebhookJobRunner();
            core.info('Running ' +
                String(inputs.executions) +
                ' webhook executions against ' +
                (inputs.endpoint ?? '') +
                '...');
            for (let i = 0; i < inputs.executions; i++) {
                const result = await runner.execute(jobConfig, { processorId: 'local-' + String(i + 1) });
                results.push(result);
                core.info('  Execution ' + String(i + 1) + ': ' + result.status);
            }
        }
        else if (inputs.type === 'script') {
            const jobConfig = await toScriptJobConfig(inputs);
            const runner = new ScriptJobRunner();
            const runtime = inputs.runtime ?? 'node';
            core.info('Running ' +
                String(inputs.executions) +
                ' script executions with ' +
                runtime +
                ' runtime...');
            for (let i = 0; i < inputs.executions; i++) {
                const result = await runner.execute(jobConfig, { processorId: 'local-' + String(i + 1) });
                results.push(result);
                core.info('  Execution ' + String(i + 1) + ': ' + result.status);
            }
        }
        else if (inputs.type === 'dns') {
            const jobConfig = toDnsJobConfig(inputs);
            const runner = new DnsJobRunner();
            const recordType = inputs.recordType ?? 'A';
            core.info('Running ' +
                String(inputs.executions) +
                ' DNS lookups for ' +
                (inputs.hostname ?? '') +
                ' (' +
                recordType +
                ')...');
            for (let i = 0; i < inputs.executions; i++) {
                const result = await runner.execute(jobConfig, { processorId: 'local-' + String(i + 1) });
                results.push(result);
                core.info('  Execution ' + String(i + 1) + ': ' + result.status);
            }
        }
        else {
            const jobConfig = toTlsJobConfig(inputs);
            const runner = new TlsJobRunner();
            const port = inputs.port ?? 443;
            core.info('Running ' +
                String(inputs.executions) +
                ' TLS certificate checks for ' +
                (inputs.hostname ?? '') +
                ':' +
                String(port) +
                '...');
            for (let i = 0; i < inputs.executions; i++) {
                const result = await runner.execute(jobConfig, { processorId: 'local-' + String(i + 1) });
                results.push(result);
                core.info('  Execution ' + String(i + 1) + ': ' + result.status);
            }
        }
        const quorumResult = aggregator.aggregate(results, quorumConfig, jobId, startTime);
        setOutputs(quorumResult);
        await writeSummary(quorumResult, inputs);
        if (quorumResult.verdict === 'pass') {
            core.info('Quorum PASSED: ' +
                String(quorumResult.agreementCount) +
                '/' +
                String(quorumResult.totalExecutions) +
                ' agreed');
        }
        else {
            core.setFailed('Quorum FAILED: ' +
                String(quorumResult.agreementCount) +
                '/' +
                String(quorumResult.totalExecutions) +
                ' agreed (required: ' +
                String(quorumResult.requiredAgreement) +
                ')');
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unexpected error occurred');
        }
    }
}
void run();
//# sourceMappingURL=main.js.map