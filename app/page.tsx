'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [view, setView] = useState<'create' | 'search'>('create');
  const [formData, setFormData] = useState({
    deal_name: '',
    property_address: '',
    deal_type: 'Single Family',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const dealTypes = ['Single Family', 'Duplex', 'Triplex', 'Fourplex', 'Multifamily', 'Office', 'Retail', 'Industrial', 'Mixed Use', 'Self Storage', 'Mobile Home Park', 'RV Park', 'Land', 'Other'];

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          submitted_by: 'operator',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create deal');
      }

      const deal = await response.json();
      setSuccess(`Deal created successfully! ID: ${deal.id}`);

      // Redirect to deal workflow
      setTimeout(() => {
        window.location.href = `/deal/${deal.id}`;
      }, 1000);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/deals?address=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const deals = await response.json();
        setSearchResults(deals);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="screen">
      <div className="screen-title">Raw Deal Verifier Dashboard</div>
      <div className="screen-subtitle">Create a new analysis or search existing deals</div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <button className={`btn ${view === 'create' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('create')}>
          Create New Deal
        </button>
        <button className={`btn ${view === 'search' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('search')}>
          Search & Reopen
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {view === 'create' && (
        <form onSubmit={handleCreateDeal}>
          <div className="form-group">
            <label>Deal Name</label>
            <input
              type="text"
              value={formData.deal_name}
              onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
              placeholder="e.g., Lancaster Duplex, 123 Main St"
              required
            />
          </div>

          <div className="form-group">
            <label>Property Address</label>
            <input
              type="text"
              value={formData.property_address}
              onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
              placeholder="Full property address"
              required
            />
          </div>

          <div className="form-group">
            <label>Deal Type</label>
            <select value={formData.deal_type} onChange={(e) => setFormData({ ...formData, deal_type: e.target.value })} required>
              {dealTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Deal & Continue'}
            </button>
          </div>
        </form>
      )}

      {view === 'search' && (
        <div>
          <div className="form-group">
            <label>Search by Address</label>
            <input type="text" placeholder="Enter address..." onChange={(e) => handleSearch(e.target.value)} />
          </div>

          {searchResults.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Deal Name</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Version</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((deal) => (
                  <tr key={deal.id}>
                    <td>{deal.deal_name}</td>
                    <td>{deal.property_address}</td>
                    <td>{deal.deal_type}</td>
                    <td>{new Date(deal.created_date).toLocaleDateString()}</td>
                    <td>v{deal.current_version}</td>
                    <td>
                      <Link href={`/deal/${deal.id}`}>
                        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                          Open
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
