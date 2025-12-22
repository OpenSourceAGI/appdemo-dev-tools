import { type NextRequest, NextResponse } from "next/server"
import { createEC2Client } from "@/lib/aws-ec2-client"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      instanceId,
      region,
      installDokploy,
      dokployApiKey,
      installDevToolsShell,
      dockerServices,
      githubRepos,
      customScript,
    } = body

    // Get credentials from headers or environment
    const accessKeyId = req.headers.get("x-aws-access-key-id") || process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = req.headers.get("x-aws-secret-access-key") || process.env.AWS_SECRET_ACCESS_KEY

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: "AWS credentials not provided" }, { status: 401 })
    }

    const ec2 = createEC2Client(accessKeyId, secretAccessKey, region)

    // Build the installation script
    let installScript = "#!/bin/bash\n\n"
    installScript += "set -e\n\n"
    installScript += "echo 'Starting software installation...'\n\n"

    // Install Dokploy
    if (installDokploy) {
      installScript += "# Install Dokploy\n"
      installScript += "curl -sSL https://dokploy.com/install.sh | sh\n\n"
    }

    if (installDevToolsShell) {
      installScript += "# Install comprehensive dev tools shell\n"
      installScript += "echo 'Installing Fish, Neovim, Nushell, Bun, Node, Helix, Starship, and more...'\n"
      installScript += "wget -qO- https://dub.sh/dev.sh | bash -s -- all\n"
      installScript += "echo 'Dev tools shell installation completed'\n\n"
    }

    // Setup Docker Compose for new services
    if (dockerServices && dockerServices.length > 0) {
      installScript += "# Setup Docker Compose\n"
      installScript += "cd /root\n"
      installScript += "cat > docker-compose-addon.yml << 'EOFCOMPOSE'\n"
      installScript += "version: '3.8'\n"
      installScript += "services:\n"

      dockerServices.forEach((service: any) => {
        installScript += `  ${service.name}:\n`
        installScript += `    image: ${service.image}\n`
        installScript += `    restart: unless-stopped\n`
        if (service.ports && service.ports.length > 0) {
          installScript += `    ports:\n`
          service.ports.forEach((port: string) => {
            installScript += `      - "${port}"\n`
          })
        }
        installScript += "\n"
      })

      installScript += "EOFCOMPOSE\n\n"
      installScript += "docker-compose -f docker-compose-addon.yml up -d\n\n"
    }

    // Clone and deploy GitHub repos
    if (githubRepos && githubRepos.length > 0) {
      installScript += "# Clone GitHub repositories\n"
      installScript += "mkdir -p /root/repos\n"
      installScript += "cd /root/repos\n\n"

      githubRepos.forEach((repo: any) => {
        const repoName = repo.name.split("/").pop()
        installScript += `git clone ${repo.url} ${repoName}\n`
      })

      if (installDokploy && dokployApiKey) {
        installScript += "\n# Deploy to Dokploy via API\n"
        githubRepos.forEach((repo: any) => {
          installScript += `echo "Deploying ${repo.name} to Dokploy..."\n`
          installScript += `# You can add Dokploy API calls here when available\n`
        })
      }

      installScript += "\n"
    }

    // Add custom script
    if (customScript && customScript.trim()) {
      installScript += "# Custom script\n"
      installScript += customScript + "\n\n"
    }

    installScript += "echo 'Software installation completed!'\n"

    // Use AWS Systems Manager Run Command to execute the script
    // Note: This requires the instance to have the SSM agent and appropriate IAM role
    // For simplicity, we'll use user data attribute update (requires instance stop/start)

    console.log("[v0] Generated installation script for instance:", instanceId)
    console.log("[v0] Script:", installScript)

    // In a production environment, you would use SSM Run Command:
    // aws ssm send-command --instance-ids ${instanceId} --document-name "AWS-RunShellScript" --parameters commands="${installScript}"

    return NextResponse.json({
      message: "Installation script prepared. Note: Requires SSM agent or manual execution.",
      script: installScript,
    })
  } catch (error: any) {
    console.error("[v0] Error installing software:", error)
    return NextResponse.json({ error: error.message || "Failed to install software" }, { status: 500 })
  }
}
