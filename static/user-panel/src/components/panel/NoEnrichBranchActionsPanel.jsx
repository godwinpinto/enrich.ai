import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { view, events, invoke, router, Modal } from '@forge/bridge';
import Spinner from '@atlaskit/spinner';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Button, { ButtonGroup } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import ProgressBar from '@atlaskit/progress-bar';

const NoEnrichBranchActionsPanel = ({ enrichData }) => {
    const [loading, setLoading] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState('');

    const generateComments = useCallback(async (creationType) => {
        const payload = {
            originalBranchRepo: enrichData.originalBranchRepo,
            enrichBranchRepo: enrichData.enrichBranchRepo,
            originalBranchName: enrichData.originalBranchName,
            enrichBranchName: enrichData.enrichBranchName,
            owner: enrichData.owner,
            creationType:creationType,
        };
        setLoading(true)
        const res = await invoke('generate-comments', payload);
        setDeleteStatus('ok')
        setTimeout(reloadPanel, 3000)
        setLoading(false)
    }, [enrichData.enrichBranchName]);

    const reloadPanel = () => {
        router.reload();
    }
    return (
        <div style={{ width: '90%', display: 'flex', flexDirection: 'column', marginTop: "10px" }}>
            <div style={{ width: '100%' }}>

                <p> Generate doc comments in your code with Enrich.AI.</p>
                <ul style={{ fontSize: '13px' }}>
                    <li><strong>Last commit: </strong>Add doc comments to files that differ in this branch by only 1 commit</li>
                    {/* <li><strong>All commit: </strong>Add doc comments to files that were made to this branch</li> */}
                    <li><strong>Compare with Main Branch: </strong>Add doc comments to files that difference in this branch in comparison to main branch</li>
                    <li><strong><i>Note:</i> </strong>This action will generate a new branch (from the chosen action) and will not affect your work</li>
                </ul>
            </div>
            <div
                style={{
                    padding: '2rem',
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                }}
            >
                <ButtonGroup>
                    <Button appearance="primary" onClick={()=>generateComments('L')}>Last Commit</Button>
                    {/* <Button appearance="primary" onClick={generateComments}>All Commits</Button> */}
                    <Button appearance="primary" onClick={()=>generateComments('M')}>With Main Branch</Button>
                </ButtonGroup>
                {loading ? (
                    <div style={{ marginTop: "20px" }}>
                        <ProgressBar ariaLabel="Loading issues" isIndeterminate />
                    </div>
                ) : ''}
                {deleteStatus && deleteStatus == 'ok' ? (
                    <SectionMessage appearance="success" title="Enrich branch created. Reloading page." />
                ) : deleteStatus && deleteStatus == 'error' ? (

                    <SectionMessage
                        title="Something went wrong. Reloading page."
                        appearance="error"
                    />
                ) : ''
                }
            </div>
        </div>
    )
}

export default NoEnrichBranchActionsPanel