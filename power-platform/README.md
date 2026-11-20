# Power Platform source

The unpacked `MarksOversight` solution goes in `solution/` (see `docs/POWER_PLATFORM_DESIGN.md` §7):

```bash
pac solution export --name MarksOversight --path MarksOversight.zip
pac solution unpack --zipfile MarksOversight.zip --folder power-platform/solution --allowDelete
```

Commit the unpacked folder, not the zip. Never commit list data or connection secrets.
