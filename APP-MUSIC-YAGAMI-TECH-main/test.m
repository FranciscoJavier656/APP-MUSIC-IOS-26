#include <math.h>
#include <stdio.h>

int main() {
    int numBins = 64;
    float minBin = 1.0;
    float maxBin = 511.0;
    float logMin = log10f(minBin);
    float logMax = log10f(maxBin);
    
    for (int i = 0; i < numBins; i+=10) {
        float logPos1 = logMin + ((float)i / (float)numBins) * (logMax - logMin);
        float logPos2 = logMin + ((float)(i + 1) / (float)numBins) * (logMax - logMin);
        int binStart = (int)powf(10.0, logPos1);
        int binEnd = (int)powf(10.0, logPos2);
        printf("%d: %d to %d\n", i, binStart, binEnd);
    }
    return 0;
}
