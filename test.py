from typing import Any, Dict, List, Type
from pydantic import BaseModel, create_model

def create_pydantic_model(name: str, fields: Dict[str, Any]) -> Type[BaseModel]:
    """
    Creates a Pydantic model class from a dictionary definition.
    The dictionary should use strings to represent types like 'str', 'int', etc.
    """
    annotations = {}
    nested_models = {}

    for field_name, field_type in fields.items():
        if isinstance(field_type, dict):
            # Nested object
            nested_model_name = f"{name}_{field_name.capitalize()}"
            nested_model = create_pydantic_model(nested_model_name, field_type)
            nested_models[field_name] = (nested_model, ...)
        elif isinstance(field_type, list):
            if isinstance(field_type[0], dict):
                # List of nested objects
                nested_model_name = f"{name}_{field_name.capitalize()}Model"
                nested_model = create_pydantic_model(nested_model_name, field_type[0])
                nested_models[field_name] = (List[nested_model], ...)
            else:
                # List of primitive types
                python_type = eval(field_type[0])
                nested_models[field_name] = (List[python_type], ...)
        else:
            # Primitive types
            python_type = eval(field_type)
            nested_models[field_name] = (python_type, ...)

    return create_model(name, **nested_models)

# Sample usage
data = {
    "name": "str",
    "data": "str",
    "age": "int",
    "items": [
        {
            "item_name": "str",
            "item_id": "str"
        }
    ],
    "sub_model": {
        "item_name": "str"
    }
}

DynamicModel = create_pydantic_model("DynamicModel", data)

# Test the model
instance = DynamicModel(
    name="John",
    data="Some data",
    age=30,
    items=[{"item_name": "Item1", "item_id": "123"}],
    sub_model={
        "item_name":"abc"
    }
)

print(instance.model_dump())
