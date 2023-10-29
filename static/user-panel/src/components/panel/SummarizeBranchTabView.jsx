import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { view, events, invoke, router, Modal } from '@forge/bridge';
import Spinner from '@atlaskit/spinner';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Button, { ButtonGroup } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import ProgressBar from '@atlaskit/progress-bar';



const SummarizeBranchTabView = ({ enrichData }) => {



    const [isOpen, setIsOpen] = useState(false);
  
    const [loading, setLoading] = useState(false);
  
    const summarizeCode = useCallback(async () => {
      const payload = {
        originalBranchRepo: enrichData.originalBranchRepo,
        originalBranchName: enrichData.originalBranchName,
      };
      setLoading(true)
      const res = await invoke('summarize-code', payload);
  
      setLoading(false)
  
      const modal = new Modal({
        //resource: 'main-app',
        onClose: (payload) => { },
        size: 'xlarge',
        context: {
          summary: res.summary,
        },
      });
      modal.open();
  
    }, [enrichData.enrichBranchName]);
  
  
  
    const reloadPanel = () => {
      router.reload();
    }
  
  
    return (
      <div style={{ width: '90%', display: 'flex', flexDirection: 'column', marginTop: "10px" }}>
        <div style={{ width: '100%' }}>
          <p> Generate summary for all (first to last commit) Github repo files (updated / added) linked with this issue (helps to prepare your pull requests)</p>
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
          {loading ? (
            <div style={{ marginBottom: "20px" }}>
              <ProgressBar ariaLabel="Loading issues" isIndeterminate />
            </div>
          ) : ''}
          <ButtonGroup>
            <Button onClick={summarizeCode} appearance="primary">Generate Code Summary</Button>
  
          </ButtonGroup>
  
          {/* {deleteStatus && deleteStatus == 'ok' ? (
            <SectionMessage appearance="success" title="Enrich branch deleted" />
          ) : deleteStatus && deleteStatus == 'error' ? (
  
            <SectionMessage
              title="Something went wrong"
              appearance="error"
            />
  
          ) : ''
          } */}
  
        </div>
      </div>
    )
  }
  

  export default SummarizeBranchTabView