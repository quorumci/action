import * as core from '@actions/core';
import { randomUUID } from 'node:crypto';
import { ManagedProvider } from '@quorumci/core';
import { getInputs, toHttpJobConfig, toWebhookJobConfig, toScriptJobConfig, toDnsJobConfig, toTlsJobConfig, toQuorumConfig, } from './inputs.js';
import { setOutputs } from './outputs.js';
import { writeSummary } from './summary.js';
async function getJobConfig(inputs) {
    switch (inputs.type) {
        case 'http':
            return toHttpJobConfig(inputs);
        case 'webhook':
            return toWebhookJobConfig(inputs);
        case 'script':
            return await toScriptJobConfig(inputs);
        case 'dns':
            return toDnsJobConfig(inputs);
        case 'tls':
            return toTlsJobConfig(inputs);
    }
}
async function run() {
    try {
        const inputs = getInputs();
        const providerConfig = {
            apiKey: inputs.apiKey,
        };
        if (inputs.apiBaseUrl !== undefined) {
            providerConfig.baseUrl = inputs.apiBaseUrl;
        }
        const provider = new ManagedProvider(providerConfig);
        const jobConfig = await getJobConfig(inputs);
        const quorumConfig = toQuorumConfig(inputs);
        const job = {
            id: randomUUID(),
            config: jobConfig,
            quorum: quorumConfig,
            createdAt: new Date().toISOString(),
        };
        const quorumResult = await provider.executeForResult(job);
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