const renderHttpRedirectServer = (serverName) => `server {
    listen 80;
    listen [::]:80;
    server_name ${serverName};
    return 301 https://$host$request_uri;
}`;

const renderProxyLocation = (proxyTarget) => `    location /bffssox/ {
        proxy_pass ${proxyTarget};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }`;

const renderAssetLocation = (allowOrigin) => {
  if (!allowOrigin) {
    return `    location /assets/ {
        try_files $uri =404;
    }`;
  }

  return `    location = /remoteEntry.js {
        add_header Access-Control-Allow-Origin ${allowOrigin} always;
        add_header Cross-Origin-Resource-Policy cross-origin always;
        try_files $uri =404;
    }

    location /assets/ {
        add_header Access-Control-Allow-Origin ${allowOrigin} always;
        add_header Cross-Origin-Resource-Policy cross-origin always;
        try_files $uri =404;
    }`;
};

const renderSpaLocation = (spaFallback) =>
  spaFallback
    ? `    location / {
        try_files $uri $uri/ /index.html;
    }`
    : `    location / {
        try_files $uri =404;
    }`;

const renderHttpsServer = ({ application, plan, currentRoot }) => {
  const ssl = plan.environment.ssl[application.id];
  const allowOrigin = application.allowShellOriginAssetRequests
    ? plan.environment.shellOrigin
    : null;
  const blocks = [
    application.proxyBrowserApi ? renderProxyLocation(plan.environment.bff.proxyTarget) : null,
    renderAssetLocation(allowOrigin),
    renderSpaLocation(application.spaFallback),
  ].filter(Boolean);

  return `server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${plan.environment.hosts[application.id]};

    ssl_certificate ${ssl.certificatePath};
    ssl_certificate_key ${ssl.certificateKeyPath};

    root ${currentRoot}/${application.deploySubdirectory};
    index index.html;

    add_header X-Content-Type-Options nosniff always;

${blocks.join("\n\n")}
}`;
};

export const renderNginxConfig = (plan) => {
  const currentRoot = `${plan.environment.vm.appRoot}/current`;
  const redirectServers = plan.applications.map((application) =>
    renderHttpRedirectServer(plan.environment.hosts[application.id])
  );
  const httpsServers = plan.applications.map((application) =>
    renderHttpsServer({ application, plan, currentRoot })
  );

  return [...redirectServers, ...httpsServers].join("\n\n");
};
