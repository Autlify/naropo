---
agent: agent
description: Complete the specified feature or code based on current codebase architecture, design patterns, coding standards, and best practices using to work towards enterprise grade readiness, industry best practices, aligned to Stripe, and IFRS compliance based on the provided feature context or incomplete code snippet.
model: Claude Opus 4.5 (copilot)
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'com.stripe/mcp/*', 'memory', 'todo']
--- 
# Feature/Code Completion
Complete the specified feature or code based on current codebase architecture, design patterns, coding standards, and best practices using to work towards enterprise grade readiness, industry best practices, aligned to Stripe, and IFRS compliance based on the provided feature context or incomplete code snippet.

## Completion Objectives
1. **Understand Context**:
   - Analyze the provided feature description or incomplete code snippet
   - Identify relevant modules, components, or utilities in the codebase
   - Map out dependencies and interactions

2. **Adhere to Architecture**:
   - Follow established architecture styles and patterns
   - Ensure scalability, performance, and maintainability considerations
   - Align with overall system design principles  

3. **Follow Coding Standards**:
   - Use consistent naming conventions and file structures
   - Ensure type safety and proper interface definitions
   - Implement error handling and logging as per standards 

4. **Incorporate Best Practices**:
   - Apply security measures and compliance requirements
   - Ensure accessibility and responsive design (if applicable)
   - Write clean, well-documented, and testable code

## Completion Steps
1. **Analyze Input**:
   - Read the provided feature context or incomplete code snippet
   - Search the codebase for related implementations or patterns
   - Document findings and relevant references

2. **Plan Completion**:
    - Outline the necessary changes or additions
    - Identify files and modules to be created or modified
    - Ensure minimal disruption to existing functionality

3. **Implement Changes**:
   - Write code following established conventions and standards
   - Test new functionality thoroughly
   - Document changes and update relevant documentation

4. **Review and Refine**:
   - Conduct code reviews for quality assurance
   - Refactor as needed for optimization and clarity
   - Finalize and prepare for next feature implementation or integration

## Feature/Code to Complete
{{input}}

FI-GL Feature: Analyze the codebase comprehensively to identify and implement the General Ledger (GL) functionality, ensuring compliance with IFRS standards, accurate financial reporting, and seamless integration with existing accounting modules.