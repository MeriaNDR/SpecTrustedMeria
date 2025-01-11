
document.addEventListener('DOMContentLoaded', async () => {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const readmeElement = document.getElementById('readme');

    if (!loadingElement || !errorElement || !readmeElement) {
        console.error('Required elements not found');
        return;
    }

    async function parseGithubReadme(url) {
        try {
            const urlParts = url.split('/');
            const owner = urlParts[3];
            const repo = urlParts[4];
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;

            loadingElement.style.display = 'flex';
            errorElement.style.display = 'none';
            readmeElement.innerHTML = '';

            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/vnd.github.raw',
                    'User-Agent': 'GitHub-README-Viewer'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch README');
            }

            let content = await response.text();
            let title = content.split('\n')[0];
            let other = content.split('\n').splice(1).join('\n');
            other = other.replace(/^[\s\S]+?---/g, '---');

            content = title + '\n' + other;

            // Convert relative URLs to absolute
            const processedContent = content.replace(
                /(\[.*?\])\(((?!http)[^)]+)\)/g,
                (match, linkText, url) => {
                    if (url.startsWith('#')) {
                        return match; // Keep anchor links as-is
                    }
                    const absoluteUrl = url.startsWith('/') 
                        ? `https://github.com/${owner}/${repo}/blob/main${url}`
                        : `https://github.com/${owner}/${repo}/blob/main/${url}`;
                    return `${linkText}(${absoluteUrl})`;
                }
            );

            // Convert markdown to HTML and sanitize
            const htmlContent = marked.parse(processedContent);
            const sanitizedContent = DOMPurify.sanitize(htmlContent, {
                ADD_TAGS: ['img'],
                ADD_ATTR: ['src', 'alt']
            });

            loadingElement.style.display = 'none';
            readmeElement.innerHTML = sanitizedContent;

            // Add target="_blank" to all links
            readmeElement.querySelectorAll('a').forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });

        } catch (error) {
            loadingElement.style.display = 'none';
            errorElement.style.display = 'block';
            errorElement.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
            console.error('Error parsing GitHub README:', error);
        }
    }

    parseGithubReadme("https://github.com/MeriaNDR/SpecTrustedMeria");
});