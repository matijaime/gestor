"""
Genera el archivo AgregarGasto.shortcut para importar en iPhone/iPad.
Uso: python generate_shortcut.py
Salida: AgregarGasto.shortcut (en el mismo directorio)
"""

import plistlib
import pathlib

# ── Helpers para tokens de texto ──────────────────────────────────────────────

def text_token_string(text: str) -> dict:
    """Texto plano sin variables."""
    return {
        "Value": {"attachmentsByRange": {}, "string": text},
        "WFSerializationType": "WFTextTokenString",
    }


def text_token_var(var_name: str) -> dict:
    """Referencia a una variable como token de texto."""
    return {
        "Value": {
            "attachmentsByRange": {
                "{0, 1}": {
                    "Aggrandizements": [],
                    "Type": "Variable",
                    "VariableName": var_name,
                }
            },
            "string": "￼",
        },
        "WFSerializationType": "WFTextTokenString",
    }


def dict_text_item(key: str, var_name: str) -> dict:
    """Ítem de diccionario tipo texto que apunta a una variable."""
    return {
        "WFItemType": 0,
        "WFKey": text_token_string(key),
        "WFValue": text_token_var(var_name),
    }


def dict_literal_item(key: str, value: str) -> dict:
    """Ítem de diccionario tipo texto con valor literal."""
    return {
        "WFItemType": 0,
        "WFKey": text_token_string(key),
        "WFValue": text_token_string(value),
    }


# ── Acciones del shortcut ──────────────────────────────────────────────────────

def action(identifier: str, params: dict) -> dict:
    return {
        "WFWorkflowActionIdentifier": identifier,
        "WFWorkflowActionParameters": params,
    }


CATEGORIAS = [
    "🍔 Comida",
    "🚗 Transporte",
    "🏠 Casa",
    "⚡ Servicios",
    "🎬 Entretenimiento",
    "👕 Ropa",
    "💊 Salud",
    "📚 Educación",
    "💸 Otros",
]

actions_list = [

    # 1. Pedir monto
    action("is.workflow.actions.ask", {
        "WFAskActionPrompt": "💵 ¿Cuánto gastaste? (ARS)",
        "WFAskActionInputType": "Number",
        "WFAskActionDefaultAnswer": "",
        "CustomOutputName": "Monto",
    }),

    # 2. Guardar en variable "monto"
    action("is.workflow.actions.setvariable", {
        "WFVariableName": "monto",
    }),

    # 3. Pedir descripción
    action("is.workflow.actions.ask", {
        "WFAskActionPrompt": "📝 ¿Descripción? (opcional)",
        "WFAskActionInputType": "Text",
        "WFAskActionDefaultAnswer": "",
        "CustomOutputName": "Descripcion",
    }),

    # 4. Guardar en variable "descripcion"
    action("is.workflow.actions.setvariable", {
        "WFVariableName": "descripcion",
    }),

    # 5. Lista de categorías
    action("is.workflow.actions.list", {
        "WFItems": CATEGORIAS,
        "CustomOutputName": "Lista categorias",
    }),

    # 6. Elegir categoría del menú
    action("is.workflow.actions.choosefromlist", {
        "WFChooseFromListActionPrompt": "📂 Elegí una categoría",
        "WFChooseFromListActionSelectMultiple": False,
        "CustomOutputName": "Categoria",
    }),

    # 7. Guardar categoría
    action("is.workflow.actions.setvariable", {
        "WFVariableName": "categoria",
    }),

    # 8. Construir diccionario con los datos del gasto
    action("is.workflow.actions.dictionary", {
        "WFItems": {
            "Value": {
                "WFDictionaryFieldValueItems": [
                    dict_text_item("monto", "monto"),
                    dict_text_item("descripcion", "descripcion"),
                    dict_text_item("categoria", "categoria"),
                ]
            },
            "WFSerializationType": "WFDictionaryFieldValue",
        },
        "CustomOutputName": "Datos del gasto",
    }),

    # 9. POST a la API — URL y API key vienen de WFWorkflowImportQuestions
    action("is.workflow.actions.downloadurl", {
        "WFHTTPMethod": "POST",
        "WFHTTPBodyType": "JSON",
        "WFRequestVariable": {
            "Value": {
                "attachmentsByRange": {
                    "{0, 1}": {
                        "Aggrandizements": [],
                        "Type": "Variable",
                        "VariableName": "Datos del gasto",
                    }
                },
                "string": "￼",
            },
            "WFSerializationType": "WFTextTokenString",
        },
        "WFHTTPHeaders": {
            "Value": {
                "WFDictionaryFieldValueItems": [
                    dict_literal_item("Content-Type", "application/json"),
                    dict_literal_item("x-api-key", "REEMPLAZA_CON_TU_API_KEY"),
                ]
            },
            "WFSerializationType": "WFDictionaryFieldValue",
        },
        "WFURL": "https://REEMPLAZA_CON_TU_URL/api/shortcuts/expense",
        "CustomOutputName": "Respuesta API",
    }),

    # 10. Obtener el campo "message" de la respuesta JSON
    action("is.workflow.actions.getvalueforkey", {
        "WFDictionaryKey": text_token_string("message"),
        "WFInput": {
            "Value": {
                "attachmentsByRange": {
                    "{0, 1}": {
                        "Aggrandizements": [],
                        "Type": "Variable",
                        "VariableName": "Respuesta API",
                    }
                },
                "string": "￼",
            },
            "WFSerializationType": "WFTextTokenString",
        },
        "CustomOutputName": "Mensaje resultado",
    }),

    # 11. Mostrar notificación con el resultado
    action("is.workflow.actions.notification", {
        "WFNotificationActionBody": text_token_var("Mensaje resultado"),
        "WFNotificationActionTitle": "Gestor de Finanzas",
        "WFNotificationActionSound": True,
    }),
]

# ── Estructura completa del shortcut ──────────────────────────────────────────

shortcut = {
    "WFWorkflowClientVersion": "1240.0.0.0.0",
    "WFWorkflowMinimumClientVersion": 900,
    "WFWorkflowMinimumClientVersionString": "900",
    "WFWorkflowName": "Agregar Gasto",
    "WFWorkflowIcon": {
        "WFWorkflowIconStartColor": 463140863,   # Verde
        "WFWorkflowIconGlyphNumber": 59500,       # Billetera
    },
    "WFWorkflowActions": actions_list,
    "WFWorkflowImportQuestions": [],
    "WFWorkflowInputContentItemClasses": [],
    "WFWorkflowOutputContentItemClasses": [],
    "WFWorkflowTypes": [],
    "WFQuickActionSurfaces": [],
}

# ── Escribir el archivo ────────────────────────────────────────────────────────

output = pathlib.Path(__file__).parent.parent / "AgregarGasto.shortcut"
with open(output, "wb") as f:
    plistlib.dump(shortcut, f, fmt=plistlib.FMT_XML)

print(f"✅ Shortcut generado: {output}")
print()
print("📋 Próximos pasos:")
print("  1. Copiá AgregarGasto.shortcut a tu iPhone (AirDrop, iCloud Drive, etc.)")
print("  2. Abrilo desde la app Archivos → tap en el archivo → 'Agregar atajo'")
print("  3. Abrí el atajo en Atajos → editalo → reemplazá la URL y API key en la acción 'Obtener contenido de URL'")
print("  4. Listo: ejecutalo desde el widget o desde la app Atajos")
