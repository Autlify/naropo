---
name: api-consolidate
description: Consolidate multiple API specifications into a single, unified API design.
argument-hint: Provide multiple API specifications to be consolidated.
agent: agent
model: Claude Opus 4.5 (copilot)
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'com.stripe/mcp/*', 'memory', 'todo']
---
# API Specification Consolidation
You are tasked with consolidating multiple API specifications into a single, unified API design. Follow these steps to ensure a comprehensive and coherent consolidation:

## Consolidation Steps
1. **Review Each Specification**:
   - Read through each provided API specification thoroughly.
   - Identify common endpoints, data models, and authentication methods.

2. **Identify Overlaps and Differences**:
   - Highlight overlapping endpoints and functionalities.
   - Note any conflicting data models or authentication schemes.

3. **Design Unified Endpoints**:
   - Create a consolidated list of endpoints that cover all functionalities.
   - Ensure that each endpoint has a clear purpose and avoids redundancy.

4. **Harmonize Data Models**:
   - Merge similar data models into unified structures.
   - Resolve any conflicts in data types or field names.

5. **Standardize Authentication**:
   - Choose a single authentication method that meets the needs of all specifications.
   - Ensure it is secure and scalable.

6. **Document the Unified API**:
   - Provide clear documentation for each endpoint, including request/response formats.
   - Include authentication details and any necessary usage guidelines.

## Request Details
{{input}}
Consolidate the following API specifications into a single, unified API design that adheres to best practices in API development, ensuring clarity, consistency, and maintainability. Provide the consolidated API specification in OpenAPI format, including all endpoints, data models, and authentication methods.