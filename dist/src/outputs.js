import * as core from '@actions/core';
export function setOutputs(result) {
    core.setOutput('verdict', result.verdict);
    core.setOutput('quorum-met', String(result.quorumMet));
    core.setOutput('agreement-count', String(result.agreementCount));
    core.setOutput('result-json', JSON.stringify(result));
}
//# sourceMappingURL=outputs.js.map