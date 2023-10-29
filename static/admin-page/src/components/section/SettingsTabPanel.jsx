import React, { useEffect, useState, useCallback } from 'react';
import { invoke, router } from '@forge/bridge';
import { Label, HelperMessage } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import { Grid, Box } from '@atlaskit/primitives';
import Button, { LoadingButton } from '@atlaskit/button';
import SectionMessage from '@atlaskit/section-message';
import { Radio } from '@atlaskit/radio';
import {getRandomNumber} from '../../utils/generic'


const SettingsTabPanel = ({ setSecrets, secrets, setRefreshContent }) => {
    const [errorMessage, setErrorMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);
    const [isLoadingSave, setIsLoadingSave] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);

    const updateSecrets = () => {
        setErrorMessage(false)
        if (secrets.makerSuite.includes('***') || secrets.githubToken.includes('***') || secrets.repoOwner.trim() == '') {
            setErrorMessage(true)
            hideMessage();
            return
        }
        setIsLoadingSave(true);
        invoke('set-app-secrets', secrets).then((data) => {
            if (data.status == "ok") {
                setSecrets(data.keys)
                setRefreshContent(getRandomNumber());
                setSuccessMessage(true)
            } else {
                setErrorMessage(true)
            }
            setIsLoadingSave(false);
            hideMessage();
        }
        );

    }

    const deleteSecrets = () => {
        setErrorMessage(false)
        setIsLoadingDelete(true);
        invoke('delete-app-secrets', secrets).then((data) => {
            if (data.status == "ok") {
                setSecrets(data.keys)
                setRefreshContent(getRandomNumber());
                setSuccessMessage(true)
            } else {
                setErrorMessage(true)
            }
            setIsLoadingDelete(false);
            hideMessage();
        }
        );

    }

    const hideMessage = () => {
        setTimeout(() => {
            setErrorMessage(false)
            setSuccessMessage(false)
        }, 5000)
    }

    const changeRepoType = (repoType) => {
        setSecrets({ ...secrets, repoType: repoType });
    }

    const handleTextfieldChange = (event, field) => {
        setSecrets({ ...secrets, [field]: event.target.value });
    }

    const openMakerSuiteLink = () => {
        router.open('https://makersuite.google.com');
    }
    const openGithubLink = () => {
        router.open('https://docs.github.com/en/enterprise-server@3.6/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens');
    }

    return (
        <div style={{ width: '90%', display: 'flex', flexDirection: 'column', marginTop: "10px" }}>
            <div style={{ width: '100%' }}>
                <p>Please enter a your Gitlab classic token and MakerSuite key to let Enrich.AI do the AI magic on your code</p>
            </div>
            <div style={{ height: "20px" }}></div>
            <Grid gap="space.200" alignItems="center" >
                <Grid templateColumns="1fr 1fr" testId="grid-basic" gap="space.100">
                    <div>
                        <Label htmlFor="basic-textfield">MakerSuite Key <Button appearance="link" tabIndex="-1" onClick={openMakerSuiteLink} >Where to find?</Button></Label>
                        <Textfield name="basic" id="basic-textfield" value={secrets.makerSuite} onChange={(e) => handleTextfieldChange(e, 'makerSuite')} />
                        <HelperMessage>
                            Enrich AI users MakerSuite AI Model from Google to generate the code magic.
                        </HelperMessage>
                    </div>
                    <div></div>
                    <div>
                        <Label htmlFor="basic-textfield">GitHub Classic Token <Button tabIndex="-1" appearance="link" onClick={openGithubLink}>Where to find?</Button></Label>
                        <Textfield name="basic" id="basic-textfield" value={secrets.githubToken} onChange={(e) => handleTextfieldChange(e, 'githubToken')} />
                        <HelperMessage>
                            Enrich AI will use this Github user to view / create / delete only enrich postfix branche names.
                        </HelperMessage>
                    </div>
                    <div></div>
                    <div>
                        <Label htmlFor="basic-textfield">Repository Owner / Organization</Label>
                        <Textfield name="basic" id="basic-textfield" value={secrets.repoOwner} onChange={(e) => handleTextfieldChange(e, 'repoOwner')} />
                        <HelperMessage>
                            Example: www.github.com/<b>coauth</b>, here coauth is the organization.
                        </HelperMessage>
                    </div>
                    <div></div>
                    <div>
                        <Label htmlFor="basic-textfield">Repository Type</Label>
                        <Box>
                            <Radio
                                value="O"
                                label="Organization"
                                name="repoType"
                                testId="repoType"
                                isChecked={secrets.repoType == 'O'}
                                onChange={() => changeRepoType('O')}
                            />
                            <Radio
                                value="U"
                                label="User"
                                name="repoType"
                                testId="repoType"
                                isChecked={secrets.repoType == 'U'}
                                onChange={() => changeRepoType('U')}
                            />
                        </Box>
                        <HelperMessage>
                            Example: www.github.com/<b>coauth</b>, here coauth is the organization.
                        </HelperMessage>
                    </div>
                </Grid>
            </Grid>
            <div style={{ marginTop: "30px" }}>
                <LoadingButton appearance="primary" isLoading={isLoadingSave} onClick={updateSecrets}>Save Secrets</LoadingButton>
                {secrets.makerSuite != '' ? (
                    <LoadingButton isLoading={isLoadingDelete} appearance="warning" onClick={deleteSecrets} style={{ marginLeft: "20px" }}>Delete Secrets & Disable Enrich.AI</LoadingButton>
                ) : ''}
            </div>
            <div style={{ height: "20px" }}></div>
            {errorMessage ? (<SectionMessage appearance="warning">
                <p>All form values should be filled correctly</p>
            </SectionMessage>) : ''}

            {successMessage ? (<SectionMessage appearance="success">
                <p>Secrets updated</p>
            </SectionMessage>) : ''}
        </div>
    )
}


export default SettingsTabPanel;
