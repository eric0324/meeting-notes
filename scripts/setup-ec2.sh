#!/bin/bash
# EC2 setup script - run on EC2 after git clone

# Create systemd service
sudo tee /etc/systemd/system/meeting.service > /dev/null <<'EOF'
[Unit]
Description=Meeting Notes App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/meeting
ExecStart=/home/ubuntu/.bun/bin/bun x next start -p 3000
Restart=always
EnvironmentFile=/home/ubuntu/meeting/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable meeting

# Build and start
export BUN=/home/ubuntu/.bun/bin/bun
cd ~/meeting
$BUN install
$BUN x next build --webpack
sudo systemctl start meeting

echo ""
echo "Done! Check status:"
sudo systemctl status meeting --no-pager
