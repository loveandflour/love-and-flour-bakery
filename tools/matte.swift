// Love & Flour — cake background removal.
//
// The four cake photos were shot on a pale blue seamless backdrop that fights the
// warm pink/red brand palette. Colour-grading the backdrop doesn't work (a hue
// shift pushes the whole frame mint-green), so we matte the cakes out properly.
//
// Uses Vision's VNGenerateForegroundInstanceMaskRequest — the same engine behind
// Preview's "Remove Background". Native, so no pip/rembg dependency (rembg has no
// wheel for the Python 3.14 installed here anyway).
//
//   swiftc -O tools/matte.swift -o tools/build/matte
//   tools/build/matte in.png out.png

import Foundation
import Vision
import CoreImage

guard CommandLine.arguments.count == 3 else {
    FileHandle.standardError.write("usage: matte <input> <output.png>\n".data(using: .utf8)!)
    exit(2)
}

let inURL  = URL(fileURLWithPath: CommandLine.arguments[1])
let outURL = URL(fileURLWithPath: CommandLine.arguments[2])

do {
    let handler = VNImageRequestHandler(url: inURL, options: [:])
    let request = VNGenerateForegroundInstanceMaskRequest()
    try handler.perform([request])

    guard let result = request.results?.first, !result.allInstances.isEmpty else {
        FileHandle.standardError.write("no foreground instance found\n".data(using: .utf8)!)
        exit(1)
    }

    // Crop to the subject's own extent — drops the empty backdrop margin so the
    // grid can apply its own consistent padding.
    let masked = try result.generateMaskedImage(
        ofInstances: result.allInstances,
        from: handler,
        croppedToInstancesExtent: true
    )

    let image = CIImage(cvPixelBuffer: masked)
    let ctx = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
    try ctx.writePNGRepresentation(
        of: image,
        to: outURL,
        format: .RGBA8,
        colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!
    )

    let w = Int(image.extent.width), h = Int(image.extent.height)
    print("\(inURL.lastPathComponent) -> \(w)x\(h), \(result.allInstances.count) instance(s)")
} catch {
    FileHandle.standardError.write("error: \(error)\n".data(using: .utf8)!)
    exit(1)
}
