import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Weavely Therapy Forms",
		version: "1.0.0",
	});

	async init() {
		// Create form tool for Weavely
		this.server.tool(
			"create-form",
			'Create a new Weavely form for therapy practice.',
			{ name: z.string().optional(), prompt: z.string() },
			async (args) => {
				const { data } = await axios.post(`https://api.weavely.ai/v1/forms/generate`, args)
					.catch((error) => {
						throw new Error(error.message);
					});

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(data, null, 2)
						}
					]
				};
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};