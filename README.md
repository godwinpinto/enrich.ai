# Enrich AI
Enrich AI enhances developer experience by generating developer doc code comments and GitHub branch summary for developers right from Jira product. This project was part of submission for [Codegeist Hackathon](https://codegeistunleashed.devpost.com/), 2023 by Atlassian

# Inspiration
With the reality of working in a technology sector for over 16 years in small and mid size companies made me realize that the hunt to delivery more functionality in less time and cost leads to sacrificing developer ethicists. This include code documentation. This leads to difficult handovers and transitions as developers move from projects or organizations.

The problem statement is not limited to small and medium IT companies, the ever demanding large corporates including BSFI are more enforced on the time and cost factor than documentation.

While new code tools allow you to write test cases and assist in writing faster code and comments. No one want to really write doc comments unless enforced (along with the much needed time).

# Enrich AI
This project contains Forge app written in Javascript with two modules;
1. Jira issue panel
2. Admin Page

## Installation Requirements
See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Installation
- Download, Clone and Build:
```
git clone https://github.com/godwinpinto/enrich.ai.git
cd enrich.ai
npm install
cd static/admin-page
npm install
npm run build
cd ../user-panel
npm install
npm run build
cd ../../
```

- Deploy on development environment:
```
forge deploy -e development
forge install 
```
- Deploy on development production:
```
forge deploy -e production
forge install 
```

## Configuration
1. Visit Apps->Manage your apps-> **Enrich.AI Admin**
2. Go tot tab **Configuration & Secrets Settings**
3. Setup your MakerSuite API key, GitHub classic token (with repo_>Full control of private repositories checked), GitHub user/organization account name 
4. Now tag the Github repositories to Jira Projects from **Project & Repository**
5. Install [Github for Jira by Atlassian](https://marketplace.atlassian.com/apps/1219592/github-for-jira?tab=overview&hosting=cloud) and configure
 
## Usage
1. Create branch for any task using the Github for Jira app
2. Click on Enrich.AI apps in your Jira issue panel

## More information
1. Visit for demo [YouTube](https://youtu.be/46VMMgvUUrY)
2. Article link on [devpost](https://devpost.com/software/enrich-ai-enhancing-developer-experience-for-documentation?ref_content=user-portfolio&ref_feature=in_progress)
3. Blog post link on [godwinpinto.hashnode.dev](https://godwinpinto.hashnode.dev/first-hand-experience-with-atlassian-forge-platform-and-the-journey)

## Notes
- This application relies on Issue key and Issue summary / title to match a branch from tagged repository

## License
This repository is released under MIT license.

## To Do
- [ ] Code Refactor
- [ ] Workflow validator (not allowing Issue closer until Enrich branch deleted)
- [ ] Scheduled trigger (to clean Enrich Git branches periodically)
- [ ] Admin configuration & Report (Additional Settings & Usage & API configuration)
- [ ] Code Feedback (Highlights improvements)
- [ ] BitBucket Integration

