graph TD
    A[start_node: User facing role] --> B{is_insufficient_data?};
    B -- true --> C[insufficient_data_node: Request for missing data];
    B -- false --> D[products_details_extractor_node: Extract product purchase details];
    D --> E[issue_resolver_node: Resolve the user facing issue];
    E --> F{issue_type?};
    F -- close_issue: true --> G[close_issue_node: close the issue];
    F -- assign_service_agent: true --> H[assign_service_agent_node: raise service request];
    F -- estimate_repair_cost: true --> I[estimate_repair_cost: Get the estimated cost for the repair];