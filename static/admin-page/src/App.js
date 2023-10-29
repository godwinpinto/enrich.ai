import React, { useEffect, useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import ProjectPanel from './components/section/ProjectPanel';
import SettingsTabPanel from './components/section/SettingsTabPanel';
import { getRandomNumber } from './utils/generic'


function App() {
    const [secrets, setSecrets] = useState({ makerSuite: '', githubToken: '', repoOwner: '', repoType: '' });
    const [refreshContent, setRefreshContent] = useState(0);

    const [selected, setSelected] = useState(0);
    const handleUpdate = useCallback(
        (index) => setSelected(index),
        [setSelected],
    );

    useEffect(() => {
        invoke('get-app-secrets').then((data) => {
            if (data.status == "ok") {
                setSecrets(data.keys)
                setRefreshContent(getRandomNumber())
            }
        }
        );
    }, []);

    return (
        <div>
            <Tabs onChange={handleUpdate} selected={selected} id="controlled">
                <TabList>
                    <Tab>Project & Repository</Tab>
                    <Tab>Configuration & Secrets Settings</Tab>
                </TabList>
                <TabPanel>
                    <ProjectPanel secrets={secrets} refreshContent={refreshContent} />
                </TabPanel>
                <TabPanel><SettingsTabPanel setSecrets={setSecrets} secrets={secrets} setRefreshContent={setRefreshContent} />
                </TabPanel>
            </Tabs>
        </div>
    );
}

export default App;
