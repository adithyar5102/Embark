# `main.py`
# This script creates a STDIO server that exposes several tools for a service agent workflow.

# To run this script, you need to have the `fastmcp` library installed.
# You can install it using pip: `pip install "mcp-server[fastmcp]"`

import asyncio
import json
import sys
from typing import Any, Dict

# Check for the existence of the `mcp` module before trying to import
# This is a good practice to handle missing dependencies gracefully.
try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("Error: The 'mcp' library is not installed. Please install it using 'pip install \"mcp-server[fastmcp]\"'.")
    sys.exit(1)

# Initialize the FastMCP server with a name for the agent/tool set.
mcp = FastMCP("service_agent_tools", port=8001)

# --- Tool Definitions ---

@mcp.tool()
async def get_product_purchase_details(product_name: str, product_model: str) -> Dict[str, str]:
    """
    Retrieves the purchase date and customer name for a specified product and model.
    This tool provides sample data to trigger the 'raise_service_request' flow.
    
    Args:
        product_name: The name of the product.
        product_model: The model number of the product.

    Returns:
        A dictionary containing the purchase date and customer name.
    """
    print(f"Tool: get_product_purchase_details called with product_name='{product_name}' and product_model='{product_model}'", file=sys.stderr)
    # Sample data for a valid, in-warranty purchase
    return {
        "purchase_date": "2025-05-15",
        "customer_name": "John Doe"
    }

@mcp.tool()
async def get_warranty_details(product_name: str, product_model: str, purchase_date: str) -> Dict[str, Any]:
    """
    Checks the warranty status of a product based on its purchase date and model.
    This tool provides sample data that indicates the product is still under warranty.
    
    Args:
        product_name: The name of the product.
        product_model: The model number of the product.
        purchase_date: The purchase date of the product (in YYYY-MM-DD format).

    Returns:
        A dictionary indicating if the product is under warranty and the end date.
    """
    print(f"Tool: get_warranty_details called with product_name='{product_name}', product_model='{product_model}', and purchase_date='{purchase_date}'", file=sys.stderr)
    # Sample data to make the agent conclude the product is under warranty
    return {
        "is_under_warranty": True,
        "warranty_end_date": "2026-05-15"
    }

@mcp.tool()
async def raise_service_request(customer_name: str, user_request_description: str) -> Dict[str, str]:
    """
    Creates a new service request and returns a confirmation ID and message.
    This is the final tool in our target flow.
    
    Args:
        customer_name: The full name of the customer.
        user_request_description: A description of the user's issue.

    Returns:
        A dictionary with the new request ID and a confirmation message.
    """
    print(f"Tool: raise_service_request called for customer='{customer_name}' with description='{user_request_description}'", file=sys.stderr)
    # Sample data for a successful service request creation
    return {
        "request_id": "SR-987654",
        "confirmation_message": "Your service request has been successfully created."
    }

@mcp.tool()
async def get_part_cost(part_name: str) -> Dict[str, float]:
    """
    Provides the cost for a specific replacement part.
    This tool is included for completeness but is not triggered in the sample flow.
    
    Args:
        part_name: The name of the part.
    
    Returns:
        A dictionary with the cost of the part.
    """
    print(f"Tool: get_part_cost called for part='{part_name}'", file=sys.stderr)
    # Dummy data
    return {"cost": 50.75}

@mcp.tool()
async def get_service_cost(service_type: str) -> Dict[str, float]:
    """
    Provides the labor cost for a service type.
    This tool is included for completeness but is not triggered in the sample flow.
    
    Args:
        service_type: The type of service or labor.

    Returns:
        A dictionary with the cost of the service.
    """
    print(f"Tool: get_service_cost called for service_type='{service_type}'", file=sys.stderr)
    # Dummy data
    return {"cost": 120.00}

if __name__ == "__main__":
    # Initialize and run the server using the 'stdio' transport.
    # This will listen for JSON inputs from stdin and write JSON outputs to stdout.
    mcp.run(transport='sse')