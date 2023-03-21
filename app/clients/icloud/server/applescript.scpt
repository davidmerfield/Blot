on run argv
  tell application "System Events" to tell application "Finder"
    set frontmost to true
    set icloudDir to (path to home folder as text) & "Library:Mobile Documents:com~apple~CloudDocs:" as alias
    make new folder at icloudDir with properties {name:item 1 of argv}

    -- Mouse Clicked
    set uiScript to "click group 2 of list 1 of scroll area 1 of scroll area 1 of browser 1 of splitter group 1 of splitter group 1 of window 1 of application process \"Finder\""

    -- Share Folder
    set uiScript to "click menu item \"Share Folder\" of menu 1 of menu item \"Share\" of menu 1 of list 1 of scroll area 1 of scroll area 1 of browser 1 of splitter group 1 of splitter group 1 of window 1 of application process \"Finder\""

    -- Click the text field.
    set uiScript to "click text field 1 of group 1 of group 1 of window \"iCloud Sharing\" of application process \"Finder\""

    -- Type 'test@example.com'
    set uiScript to "keystroke \"test@example.com\""

    -- Click the “Share” button.
    set uiScript to "click UI Element \"Share\" of window \"iCloud Sharing\" of application process \"Finder\""
    
  end tell
end run
