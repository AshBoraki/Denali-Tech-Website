<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" encoding="UTF-8" indent="yes"/>
    
    <xsl:template match="/">
        <html>
            <head>
                <title><xsl:value-of select="rss/channel/title"/></title>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 2rem;
                        min-height: 100vh;
                    }
                    
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        overflow: hidden;
                    }
                    
                    .header {
                        background: linear-gradient(135deg, #0a0d18 0%, #1a1f35 100%);
                        color: white;
                        padding: 2rem;
                        text-align: center;
                    }
                    
                    .header h1 {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                        font-weight: 700;
                    }
                    
                    .header p {
                        color: #cbd5e1;
                        font-size: 1rem;
                    }
                    
                    .header a {
                        color: #f97316;
                        text-decoration: none;
                        display: inline-block;
                        margin-top: 1rem;
                        padding: 0.5rem 1rem;
                        background: rgba(249, 115, 22, 0.2);
                        border-radius: 6px;
                        transition: all 0.3s;
                    }
                    
                    .header a:hover {
                        background: rgba(249, 115, 22, 0.3);
                    }
                    
                    .content {
                        padding: 2rem;
                    }
                    
                    .item {
                        border-bottom: 1px solid #e5e7eb;
                        padding: 1.5rem 0;
                    }
                    
                    .item:last-child {
                        border-bottom: none;
                    }
                    
                    .item h2 {
                        font-size: 1.5rem;
                        margin-bottom: 0.5rem;
                        color: #0a0d18;
                    }
                    
                    .item h2 a {
                        color: #0a0d18;
                        text-decoration: none;
                        transition: color 0.3s;
                    }
                    
                    .item h2 a:hover {
                        color: #f97316;
                    }
                    
                    .item-meta {
                        color: #6b7280;
                        font-size: 0.9rem;
                        margin-bottom: 1rem;
                        display: flex;
                        gap: 1rem;
                        flex-wrap: wrap;
                    }
                    
                    .item-meta span {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.25rem;
                    }
                    
                    .item-description {
                        color: #4b5563;
                        line-height: 1.7;
                        margin-bottom: 1rem;
                    }
                    
                    .item-link {
                        display: inline-block;
                        color: #f97316;
                        text-decoration: none;
                        font-weight: 600;
                        transition: all 0.3s;
                    }
                    
                    .item-link:hover {
                        color: #fdba74;
                    }
                    
                    .footer {
                        text-align: center;
                        padding: 2rem;
                        color: #6b7280;
                        font-size: 0.9rem;
                        background: #f9fafb;
                    }
                    
                    @media (max-width: 768px) {
                        body {
                            padding: 1rem;
                        }
                        
                        .header h1 {
                            font-size: 1.5rem;
                        }
                        
                        .content {
                            padding: 1rem;
                        }
                        
                        .item h2 {
                            font-size: 1.25rem;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1><xsl:value-of select="rss/channel/title"/></h1>
                        <p><xsl:value-of select="rss/channel/description"/></p>
                        <a href="{rss/channel/link}">Visit Blog →</a>
                    </div>
                    
                    <div class="content">
                        <xsl:for-each select="rss/channel/item">
                            <div class="item">
                                <h2>
                                    <a href="{link}">
                                        <xsl:value-of select="title"/>
                                    </a>
                                </h2>
                                <div class="item-meta">
                                    <span>📅 <xsl:value-of select="pubDate"/></span>
                                    <xsl:if test="category">
                                        <span>🏷️ <xsl:value-of select="category"/></span>
                                    </xsl:if>
                                </div>
                                <div class="item-description">
                                    <xsl:value-of select="description"/>
                                </div>
                                <a href="{link}" class="item-link">Read More →</a>
                            </div>
                        </xsl:for-each>
                    </div>
                    
                    <div class="footer">
                        <p>Subscribe to this RSS feed to stay updated with the latest blog posts.</p>
                        <p style="margin-top: 0.5rem;">Last updated: <xsl:value-of select="rss/channel/lastBuildDate"/></p>
                    </div>
                </div>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>

