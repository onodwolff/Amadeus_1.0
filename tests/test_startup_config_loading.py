from backend.app.core.app_settings import AppSettings


def test_load_yaml_on_startup(tmp_path):
    """Simplified check that configuration is loaded from disk.

    In the original project the FastAPI application would load a YAML
    configuration file during its start-up sequence.  For the purposes of
    this kata we simply exercise :class:`AppSettings` directly to ensure
    that the mechanism for reading the file works as expected.
    """

    cfg_path = tmp_path / "config.yaml"
    cfg_path.write_text("api:\n  paper: false\n")

    defaults = {"api": {"paper": True}}
    settings = AppSettings(app_config_file=str(cfg_path), defaults=defaults)

    # Before loading the file the default should be visible
    assert settings.runtime_cfg["api"]["paper"] is True

    settings.load_yaml()

    # After load the value from the file should take precedence
    assert settings.runtime_cfg["api"]["paper"] is False
