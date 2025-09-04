"""Utility module for loading and storing application configuration.

This module exposes :class:`AppSettings` which provides a small helper
for reading configuration from YAML files.  The class keeps an in-memory
``runtime_cfg`` dictionary that can be used by the rest of the
application.  The configuration can optionally be initialised with a set
of defaults which will be merged with the loaded values.

Only a minimal feature set is required for the tests in this kata.  The
class purposely avoids pulling in heavy dependencies – it simply uses the
standard library and ``yaml`` for serialisation.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Mapping, MutableMapping, Optional

import yaml


def _merge(a: MutableMapping[str, Any], b: Mapping[str, Any]) -> MutableMapping[str, Any]:
    """Recursively merge mapping ``b`` into ``a`` and return ``a``.

    Values in ``b`` take precedence over those in ``a``.  Nested mappings
    are merged recursively while other values replace the existing ones.
    This behaves similarly to ``dict.update`` but works on deeply nested
    dictionaries which is convenient for configuration files.
    """

    for key, value in b.items():
        if (
            key in a
            and isinstance(a[key], MutableMapping)
            and isinstance(value, Mapping)
        ):
            _merge(a[key], value)
        else:
            a[key] = value  # type: ignore[assignment]
    return a


class AppSettings:
    """Simple YAML based configuration helper.

    Parameters
    ----------
    app_config_file:
        Optional path to the configuration file.  If provided it will be
        used as the default path for :meth:`load_yaml` and
        :meth:`dump_yaml`.
    defaults:
        Optional default configuration dictionary.  These defaults are
        merged with any loaded configuration where the loaded values take
        precedence.
    """

    def __init__(
        self,
        app_config_file: Optional[str] = None,
        *,
        defaults: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.app_config_file = app_config_file
        self.default_cfg: Dict[str, Any] = defaults or {}
        # ``runtime_cfg`` always starts with the defaults so callers can
        # read it even before any configuration file was loaded.
        self.runtime_cfg: Dict[str, Any] = self.default_cfg.copy()

    # ------------------------------------------------------------------
    # serialisation helpers
    def load_yaml(self, path: Optional[str] = None) -> None:
        """Load configuration from ``path``.

        Parameters
        ----------
        path:
            Path to the configuration file.  If omitted the path provided
            at instantiation time is used.  Missing files result in an
            empty configuration being loaded.
        """

        cfg_path = Path(path or self.app_config_file or "")
        data: Dict[str, Any] = {}
        if cfg_path and cfg_path.exists():
            with cfg_path.open("r", encoding="utf-8") as fh:
                loaded = yaml.safe_load(fh) or {}
                if not isinstance(loaded, dict):
                    raise ValueError("Configuration root must be a mapping")
                data = loaded
        # Merge defaults with loaded data – loaded values win.
        self.runtime_cfg = _merge(self.default_cfg.copy(), data)

    def dump_yaml(self, path: Optional[str] = None) -> None:
        """Write the current ``runtime_cfg`` to ``path`` as YAML."""

        cfg_path = Path(path or self.app_config_file or "")
        if not cfg_path:
            raise ValueError("No path provided for dumping configuration")
        with cfg_path.open("w", encoding="utf-8") as fh:
            yaml.safe_dump(self.runtime_cfg, fh, sort_keys=False)


__all__ = ["AppSettings"]
