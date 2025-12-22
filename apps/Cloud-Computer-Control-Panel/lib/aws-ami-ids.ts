// Ubuntu 22.04 LTS AMI IDs by region (updated January 2025)
// These are the latest Ubuntu 22.04 LTS (HVM) SSD Volume Type images
export const UBUNTU_AMI_IDS: Record<string, string> = {
  "us-east-1": "ami-0e86e20dae9224db8",
  "us-east-2": "ami-0ea3c35c5c3284d82",
  "us-west-1": "ami-0da424eb883458071",
  "us-west-2": "ami-05134c8ef96964280",
  "af-south-1": "ami-0a2be7731769bb966",
  "ap-east-1": "ami-0b8ff9cd45a4e12b9",
  "ap-south-1": "ami-0f58b397bc5c1f2e8",
  "ap-northeast-1": "ami-0d52744d6551d851e",
  "ap-northeast-2": "ami-0c9c942bd7bf113a2",
  "ap-northeast-3": "ami-0a7a7b7b6f1e3c1e8",
  "ap-southeast-1": "ami-0dc2d3e4c0f9ebd18",
  "ap-southeast-2": "ami-0310483fb2b488153",
  "ca-central-1": "ami-0a2e7efb4257c0907",
  "eu-central-1": "ami-0745b7d4092315796",
  "eu-west-1": "ami-0c1c30571d2dae5c9",
  "eu-west-2": "ami-0eb260c4d5475b901",
  "eu-west-3": "ami-05b5a865c3579bbc4",
  "eu-north-1": "ami-0014ce3e52359afbd",
  "eu-south-1": "ami-0c5e97f031e75f54f",
  "me-south-1": "ami-0e0d16e87e11ec70e",
  "sa-east-1": "ami-0af6e9042ea5a4e3e",
}

export function getUbuntuAMI(region: string): string {
  return UBUNTU_AMI_IDS[region] || UBUNTU_AMI_IDS["us-east-1"]
}
