from typing import Any, Dict, List, Union, get_args
from pydantic import BaseModel, create_model
import keyword
from shared.constants import VALID_TYPES

# Mapping VALID_TYPES to Python types
type_mapping = {
    "str": str,
    "int": int,
    "float": float,
    "bool": bool
}


def sanitize_field_name(name: str) -> str:
    """Make sure field names are valid Python identifiers."""
    if not name.isidentifier() or keyword.iskeyword(name):
        return f"field_{name}"
    return name


def build_pydantic_model_from_dict(
    name: str,
    data: Union[Dict[str, Any], List[Dict[str, Any]]]
) -> BaseModel:
    """
    Takes a dictionary or list of dictionaries (structured_response_format)
    and returns a dynamically generated Pydantic model.
    """

    def create_fields_from_dict(d: Dict[str, Any], prefix="") -> Dict[str, tuple]:
        fields = {}

        for key, value in d.items():
            field_name = sanitize_field_name(key)

            if isinstance(value, str):
                if value not in VALID_TYPES:
                    raise ValueError(f"Invalid type '{value}' for key '{key}'")
                fields[field_name] = (type_mapping[value], ...)
            elif isinstance(value, dict):
                sub_model = create_model(
                    f"{prefix}{field_name.capitalize()}Model",
                    **create_fields_from_dict(value, prefix=f"{prefix}{field_name}_")
                )
                fields[field_name] = (sub_model, ...)
            elif isinstance(value, list):
                if not value or not isinstance(value[0], dict):
                    raise ValueError(f"Invalid list format at key '{key}'")
                sub_model = create_model(
                    f"{prefix}{field_name.capitalize()}ItemModel",
                    **create_fields_from_dict(value[0], prefix=f"{prefix}{field_name}_")
                )
                fields[field_name] = (List[sub_model], ...)
            else:
                raise ValueError(f"Unsupported format for key '{key}': {type(value)}")

        return fields

    if isinstance(data, dict):
        model_fields = create_fields_from_dict(data)
    elif isinstance(data, list):
        if not data or not isinstance(data[0], dict):
            raise ValueError("List must contain at least one dictionary")
        model_fields = create_fields_from_dict(data[0])
    else:
        raise ValueError("Input must be a dict or list of dicts")

    model = create_model(name, **model_fields)
    return model
