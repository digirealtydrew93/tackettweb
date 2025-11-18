# Multi-Deployment API Router System

This system allows you to deploy new versions of your site while keeping the API functional by routing requests between multiple backend instances.

## How It Works

1. **Primary, Secondary, Tertiary** - Three Vercel deployments that can receive traffic
2. **Router** - An API endpoint (`/api/router`) that routes requests to the active deployment
3. **Fallback** - If the active deployment is unreachable, automatically tries the next one
4. **Management** - Easy CLI to switch between deployments

## Setup

### 1. Create Multiple Vercel Deployments

You already have these Vercel deployments:
- **Primary**: `https://tackettweb-9s7vanrs7-tackett-bros-projects.vercel.app`
- **Secondary**: `https://tackettweb-k1c9tgj94-tackett-bros-projects.vercel.app`
- **Tertiary**: `https://tackettweb-7s1rlz1mw-tackett-bros-projects.vercel.app`

Each one has the full site including the API endpoint at `/functions/submit`.

### 2. Environment Variables

Set these in your `.env` or Vercel project settings:

```bash
PRIMARY_API_URL=https://tackettweb-9s7vanrs7-tackett-bros-projects.vercel.app
SECONDARY_API_URL=https://tackettweb-k1c9tgj94-tackett-bros-projects.vercel.app
TERTIARY_API_URL=https://tackettweb-7s1rlz1mw-tackett-bros-projects.vercel.app
ACTIVE_API_INDEX=0
```

## Usage

### Check Status
```bash
node manage-deployments.js status
```
Shows which deployment is currently active.

### List All Deployments
```bash
node manage-deployments.js list
```
Shows all available deployments and their URLs.

### Switch Active Deployment
```bash
node manage-deployments.js set 1
```
Switches to the Secondary deployment. Requests will now go to that instance.

### Add New Deployment
```bash
node manage-deployments.js add "Staging v2" "https://new-deployment-url.vercel.app"
```

## Workflow for Site Updates

### Normal Development
1. Make changes to site code
2. Push to GitHub
3. Vercel auto-deploys to Primary
4. Site stays live (router handles requests)

### Large Updates / New Features
1. Make changes
2. Deploy to Primary (normal GitHub push)
3. If Primary gets overwhelmed, switch to Secondary:
   ```bash
   node manage-deployments.js set 1
   ```
4. Site traffic now goes to Secondary while Primary resets
5. Switch back when ready:
   ```bash
   node manage-deployments.js set 0
   ```

### Hitting Deployment Limit
If you hit Vercel's 100 deployments/day limit:
1. Current deployment stays active
2. Router falls back to next available deployment
3. No downtime or manual intervention needed
4. When limit resets, you can deploy normally again

## Request Flow

```
User Submit Form
       ↓
/api/router (Current Production)
       ↓
Routes to ACTIVE_API_INDEX deployment
       ↓
[Primary] → If fails, tries Secondary
              → If fails, tries Tertiary
       ↓
SMS sent via AWS SNS
       ↓
Confirmation returned to user
```

## Benefits

✅ **Zero Downtime** - Deploy new versions without affecting active requests
✅ **Easy Switching** - Single command to change active deployment
✅ **Automatic Failover** - If one endpoint fails, tries the next
✅ **Deployment Flexibility** - No more hitting deployment limits
✅ **Local Development** - Router allows continuous local testing

## Example Scenario

**Time 2:00 PM** - Deploy new feature
- Current active: Primary (index 0)
- Primary gets new version
- Users keep using Primary
- Works great

**Time 2:30 PM** - Deploy bug fix
- Switch to Secondary: `node manage-deployments.js set 1`
- Primary stays on old version (load resets)
- Users now use Secondary (new version)
- Zero downtime during switch

**Time 2:31 PM** - Deploy another fix
- Switch back to Primary: `node manage-deployments.js set 0`
- Primary has cooled down, ready for more traffic
- Users use Primary again

## Monitoring

Check which deployment is active:
```bash
node manage-deployments.js status
```

View all deployments and their status:
```bash
node manage-deployments.js list
```

Check Vercel deployment logs for each instance to see which handled requests.
