#!/usr/bin/swift
import AppKit
import OpenDirectory

func fail(_ message: String) -> Never {
  FileHandle.standardError.write(Data("\(message)\n".utf8))
  exit(1)
}

let arguments = Array(CommandLine.arguments.dropFirst())
guard arguments.isEmpty || arguments == ["--dry-run"] else {
  fail("Usage: configure-profile-photo.swift [--dry-run]")
}
let dryRun = arguments == ["--dry-run"]
let username = ProcessInfo.processInfo.environment["SUDO_USER"] ?? NSUserName()
guard username != "root" else {
  fail("Run this task as the user whose account photo should change.")
}

let repository = URL(fileURLWithPath: #filePath)
  .deletingLastPathComponent().deletingLastPathComponent()
let photo = repository.appendingPathComponent("dotfiles/macos/profile-photo.png")

do {
  let source = try Data(contentsOf: photo)
  guard let bitmap = NSBitmapImageRep(data: source),
    let jpeg = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9])
  else {
    fail("Cannot decode profile photo: \(photo.path)")
  }

  // Use the native API so JPEGPhoto is binary data, not a dscl string.
  let node = try ODNode(session: ODSession.default(), name: "/Local/Default")
  let record = try node.record(
    withRecordType: kODRecordTypeUsers, name: username,
    attributes: [kODAttributeTypePicture, kODAttributeTypeJPEGPhoto])
  let previous = try record.recordDetails(forAttributes: [
    kODAttributeTypePicture, kODAttributeTypeJPEGPhoto,
  ])
  let oldPictures = previous[kODAttributeTypePicture] as? [String] ?? []
  let oldPhotos = previous[kODAttributeTypeJPEGPhoto] as? [Data] ?? []

  if oldPictures == [photo.path] && oldPhotos == [jpeg] {
    print("Profile photo for \(username) is already up to date.")
    exit(0)
  }
  if dryRun {
    print("Set the macOS account photo for \(username) from \(photo.path)")
    print("Update Picture and the embedded JPEGPhoto; no changes made.")
    exit(0)
  }

  var changed: [String] = []
  do {
    try record.setValue([photo.path], forAttribute: kODAttributeTypePicture)
    changed.append(kODAttributeTypePicture)
    try record.setValue([jpeg], forAttribute: kODAttributeTypeJPEGPhoto)
    changed.append(kODAttributeTypeJPEGPhoto)
    try record.synchronize()

    guard try record.values(forAttribute: kODAttributeTypePicture) as? [String] == [photo.path],
      try record.values(forAttribute: kODAttributeTypeJPEGPhoto) as? [Data] == [jpeg]
    else {
      throw NSError(
        domain: "ProfilePhoto", code: 1,
        userInfo: [NSLocalizedDescriptionKey: "Account photo verification failed."])
    }
  } catch {
    // Restore attributes already written if a later operation fails.
    for attribute in changed.reversed() {
      do {
        if let values = previous[attribute] {
          try record.setValue(values, forAttribute: attribute)
        } else {
          try record.removeValues(forAttribute: attribute)
        }
      } catch {
        FileHandle.standardError.write(
          Data(
            "Could not restore \(attribute): \(error.localizedDescription)\n".utf8))
      }
    }
    throw error
  }

  print("Updated and verified the macOS account photo for \(username).")
} catch {
  fail("Could not configure profile photo: \(error.localizedDescription)")
}
