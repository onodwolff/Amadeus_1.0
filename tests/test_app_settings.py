import yaml
from backend.app.core.app_settings import AppSettings


def test_load_and_merge_defaults(tmp_path):
    cfg_file = tmp_path / "config.yaml"
    cfg_file.write_text("api:\n  autostart: true\n")

    defaults = {"api": {"paper": True, "autostart": False}}
    s = AppSettings(app_config_file=str(cfg_file), defaults=defaults)

    # before loading the file, runtime_cfg should contain defaults
    assert s.runtime_cfg["api"]["paper"] is True
    assert s.runtime_cfg["api"]["autostart"] is False

    s.load_yaml()
    assert s.runtime_cfg["api"]["paper"] is True
    assert s.runtime_cfg["api"]["autostart"] is True


def test_dump_round_trip(tmp_path):
    cfg_data = {"api": {"paper": False, "autostart": True}}
    cfg_file = tmp_path / "config.yaml"
    cfg_file.write_text(yaml.safe_dump(cfg_data))

    s = AppSettings(app_config_file=str(cfg_file))
    s.load_yaml()

    out_file = tmp_path / "round.yaml"
    s.dump_yaml(str(out_file))

    s2 = AppSettings(app_config_file=str(out_file))
    s2.load_yaml()
    assert s.runtime_cfg == s2.runtime_cfg


def test_load_yaml_explicit_path(tmp_path):
    cfg_file = tmp_path / "config.yaml"
    cfg_file.write_text("api:\n  paper: false\n")

    defaults = {"api": {"paper": True}}
    s = AppSettings(defaults=defaults)
    # load from explicit path rather than constructor supplied path
    s.load_yaml(path=str(cfg_file))

    assert s.runtime_cfg["api"]["paper"] is False
