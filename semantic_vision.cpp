#include <iostream>
#include <string>
#include <unordered_map>
#include <cmath>
#include <sstream>
#include <algorithm>
#include <cctype>

int main(int argc, char* argv[]) {
    if (argc < 2) { std::cout << "0.40" << std::endl; return 1; }

    std::string input(argv[1]);
    std::transform(input.begin(), input.end(), input.begin(), ::tolower);
    input.erase(std::remove_if(input.begin(), input.end(), ::ispunct), input.end());

    // SOTA FIX: High-Density Multi-Disciplinary Ground Truth Vector
    std::string truth = 
        "measured experimentally confirmed laboratory spectroscopy fabricated synthesized nanometer kelvin ghz thz observation room temperature fidelity quantum coherence entanglement empirical "
        "code memory safe algorithm production ready optimized zero cost abstraction thread deterministic execution fault tolerant "
        "cryptography qkd lattice based post quantum cryptographic secure payload encryption decryption";
    
    std::unordered_map<std::string, int> vec_A, vec_B;
    std::stringstream ss_truth(truth), ss_input(input);
    std::string word;

    while (ss_truth >> word) vec_A[word]++;
    while (ss_input >> word) vec_B[word]++;

    double dot_product = 0.0, norm_A = 0.0, norm_B = 0.0;
    for (const auto& pair : vec_A) {
        norm_A += pair.second * pair.second;
        if (vec_B.count(pair.first)) dot_product += pair.second * vec_B[pair.first];
    }
    for (const auto& pair : vec_B) norm_B += pair.second * pair.second;

    if (norm_A == 0.0 || norm_B == 0.0) { std::cout << "0.40" << std::endl; return 0; }

    double cosine_sim = dot_product / (std::sqrt(norm_A) * std::sqrt(norm_B));
    
    // Smooth, aggressive scaling for the expanded vector
    double final_score = 0.40 + (cosine_sim * 2.8);
    if (final_score > 1.0) final_score = 1.0;

    std::cout << final_score << std::endl;
    return 0;
}
