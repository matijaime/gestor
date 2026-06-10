#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera AgregarGasto.shortcut - Shortcut funcional para iPhone.
Creado con todos los valores configurados (sin pedir URL ni API key).

Uso: python scripts/generate_shortcut.py
"""

import plistlib
import pathlib
import os

API_URL = os.getenv("VERCEL_URL", "https://gestor-pearl.vercel.app")
API_KEY = "gestor-api-key-2024-secure-dev"

# --- helpers ------------------------------------------------------------------

def plain(text):
    return {
        "Value": {"attachmentsByRange": {}, "string": text},
        "WFSerializationType": "WFTextTokenString",
    }


def var_ref(name):
    return {
        "Value": {
            "attachmentsByRange": {
                "{0, 1}": {
                    "Aggrandizements": [],
                    "Type": "Variable",
                    "VariableName": name,
                }
            },
            "string": "﻿",
        },
        "WFSerializationType": "WFTextTokenString",
    }


def dict_item_var(key, var_name):
    return {"WFItemType": 0, "WFKey": plain(key), "WFValue": var_ref(var_name)}


def dict_item_plain(key, value):
    return {"WFItemType": 0, "WFKey": plain(key), "WFValue": plain(value)}


def act(identifier, params):
    return {
        "WFWorkflowActionIdentifier": identifier,
        "WFWorkflowActionParameters": params,
    }


# --- categorias ---------------------------------------------------------------

CATEGORIAS = [
    "🍔 Comida",
    "🚗 Transporte",
    "🏠 Casa",
    "🔧 Servicios",
    "🎬 Entretenimiento",
    "👕 Ropa",
    "💊 Salud",
    "📚 Educacion",
    "❓ Otros",
]

# --- acciones -----------------------------------------------------------------

actions = [
    # 1. Pedir monto
    act("is.workflow.actions.ask", {
        "WFAskActionPrompt": "Cuanto gastaste? (ARS)",
        "WFAskActionInputType": "Number",
        "WFAskActionDefaultAnswer": "",
        "CustomOutputName": "Monto",
    }),

    # 2. Guardar monto
    act("is.workflow.actions.setvariable", {
        "WFVariableName": "monto",
    }),

    # 3. Pedir descripcion
    act("is.workflow.actions.ask", {
        "WFAskActionPrompt": "En que gastaste? (opcional)",
        "WFAskActionInputType": "Text",
        "WFAskActionDefaultAnswer": "Sin descripcion",
        "CustomOutputName": "Descripcion",
    }),

    # 4. Guardar descripcion
    act("is.workflow.actions.setvariable", {
        "WFVariableName": "descripcion",
    }),

    # 5. Lista de categorias
    act("is.workflow.actions.list", {
        "WFItems": CATEGORIAS,
        "CustomOutputName": "Lista categorias",
    }),

    # 6. Elegir categoria
    act("is.workflow.actions.choosefromlist", {
        "WFChooseFromListActionPrompt": "Elige una categoria:",
        "WFChooseFromListActionSelectMultiple": False,
        "CustomOutputName": "Categoria",
    }),

    # 7. Guardar categoria
    act("is.workflow.actions.setvariable", {
        "WFVariableName": "categoria",
    }),

    # 8. Construir body JSON
    act("is.workflow.actions.dictionary", {
        "WFItems": {
            "Value": {
                "WFDictionaryFieldValueItems": [
                    dict_item_var("monto",       "monto"),
                    dict_item_var("descripcion", "descripcion"),
                    dict_item_var("categoria",   "categoria"),
                ]
            },
            "WFSerializationType": "WFDictionaryFieldValue",
        },
        "CustomOutputName": "Body",
    }),

    # 9. Convertir diccionario a JSON
    act("is.workflow.actions.getcontent", {
        "WFInput": var_ref("Body"),
        "WFContentItemValueType": "URLContentItem",
        "CustomOutputName": "JSON",
    }),

    # 10. POST a la API
    act("is.workflow.actions.downloadurl", {
        "WFHTTPMethod": "POST",
        "WFHTTPBodyType": "JSON",
        "WFURL": plain(API_URL + "/api/shortcuts/expense"),
        "WFRequestVariable": var_ref("Body"),
        "WFHTTPHeaders": {
            "Value": {
                "WFDictionaryFieldValueItems": [
                    dict_item_plain("Content-Type", "application/json"),
                    dict_item_plain("x-api-key", API_KEY),
                ]
            },
            "WFSerializationType": "WFDictionaryFieldValue",
        },
        "CustomOutputName": "Respuesta",
    }),

    # 11. Mostrar notificacion de exito
    act("is.workflow.actions.alert", {
        "WFAlertActionTitle": "✓ Gasto guardado",
        "WFAlertActionMessage": "Tu gasto fue registrado correctamente",
    }),
]

# --- shortcut completo --------------------------------------------------------

shortcut = {
    "WFWorkflowClientVersion": "1240.0.0.0.0",
    "WFWorkflowMinimumClientVersion": 900,
    "WFWorkflowMinimumClientVersionString": "900",
    "WFWorkflowName": "Agregar Gasto",
    "WFWorkflowIcon": {
        "WFWorkflowIconStartColor": 463140863,
        "WFWorkflowIconGlyphNumber": 59500,
    },
    "WFWorkflowActions": actions,
    "WFWorkflowImportQuestions": [],
    "WFWorkflowInputContentItemClasses": [],
    "WFWorkflowOutputContentItemClasses": [],
    "WFWorkflowTypes": [],
    "WFQuickActionSurfaces": [],
}

# --- escribir -----------------------------------------------------------------

root = pathlib.Path(__file__).parent.parent
out = root / "AgregarGasto.shortcut"

with open(out, "wb") as f:
    plistlib.dump(shortcut, f, fmt=plistlib.FMT_BINARY)

print(f"OK: {out}")
print(f"Acciones: {len(actions)}")
print(f"URL: {API_URL}/api/shortcuts/expense")
print(f"API Key: {API_KEY}")
